import { expect, type APIRequestContext } from '@playwright/test';

const API = '/web/index.php/api/v2';

export interface Employee {
  empNumber: number;
  fullName: string;
}

export interface JobTitle {
  id: number;
  title: string;
}

export interface CreatedVacancy {
  id: number;
  name: string;
  jobTitle: string;
  hiringManager: string;
  numOfPositions: number | null;
  active: boolean;
}

/**
 * Atalho pela API REST do próprio OrangeHRM, usado só para preparar e limpar
 * dados. O comportamento que está sendo testado é sempre exercitado pela UI.
 * Usa o mesmo contexto (cookies) da página autenticada.
 */
export class VacancyApi {
  private readonly created = new Set<number>();

  constructor(private readonly request: APIRequestContext) {}

  async getJobTitle(): Promise<JobTitle> {
    const res = await this.request.get(`${API}/admin/job-titles?limit=0`);
    expect(res.ok()).toBeTruthy();
    const { data } = (await res.json()) as { data: JobTitle[] };
    // Prefere um cargo "de verdade" do seed do demo aos criados por outros testes.
    const preferred = ['QA Engineer', 'Software Engineer', 'Account Assistant'];
    return data.find((j) => preferred.includes(j.title)) ?? data[0];
  }

  /**
   * Um funcionário ativo cujo nome só tem letras: o demo é cheio de registros
   * de teste com nomes aleatórios que atrapalham o autocomplete.
   */
  async getHiringManager(): Promise<Employee> {
    const res = await this.request.get(`${API}/pim/employees?limit=100&includeEmployees=onlyCurrent`);
    expect(res.ok()).toBeTruthy();
    const { data } = (await res.json()) as {
      data: { empNumber: number; firstName: string; middleName: string; lastName: string }[];
    };
    const clean = (s: string) => /^[A-Za-z]+$/.test(s);
    const emp =
      data.find((e) => clean(e.firstName) && clean(e.lastName) && (e.middleName === '' || clean(e.middleName))) ??
      data[0];
    const fullName = [emp.firstName, emp.middleName, emp.lastName].filter(Boolean).join(' ');
    return { empNumber: emp.empNumber, fullName };
  }

  async create(input: {
    name: string;
    jobTitle: JobTitle;
    hiringManager: Employee;
    numOfPositions?: number;
    description?: string;
    active?: boolean;
  }): Promise<CreatedVacancy> {
    const res = await this.request.post(`${API}/recruitment/vacancies`, {
      data: {
        name: input.name,
        jobTitleId: input.jobTitle.id,
        employeeId: input.hiringManager.empNumber,
        numOfPositions: input.numOfPositions ?? null,
        description: input.description ?? '',
        status: input.active ?? true,
        isPublished: true,
      },
    });
    expect(res.ok(), await res.text()).toBeTruthy();
    const { data } = (await res.json()) as { data: { id: number } };
    this.created.add(data.id);
    return {
      id: data.id,
      name: input.name,
      jobTitle: input.jobTitle.title,
      hiringManager: input.hiringManager.fullName,
      numOfPositions: input.numOfPositions ?? null,
      active: input.active ?? true,
    };
  }

  async findByName(name: string): Promise<{ id: number; name: string } | undefined> {
    const res = await this.request.get(`${API}/recruitment/vacancies?limit=0`);
    expect(res.ok()).toBeTruthy();
    const { data } = (await res.json()) as { data: { id: number; name: string }[] };
    return data.find((v) => v.name === name);
  }

  /** Registra uma vaga criada pela UI para ser removida no teardown. */
  track(id: number): void {
    this.created.add(id);
  }

  async cleanup(): Promise<void> {
    if (this.created.size === 0) return;
    // Ids que o próprio teste já excluiu são ignorados pela API.
    await this.request.delete(`${API}/recruitment/vacancies`, { data: { ids: [...this.created] } });
    this.created.clear();
  }
}
