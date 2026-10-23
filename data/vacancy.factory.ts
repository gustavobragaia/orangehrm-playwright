import { randomUUID } from 'node:crypto';

export interface VacancyData {
  name: string;
  jobTitle: string;
  hiringManager: string;
  description?: string;
  numOfPositions?: number;
  active?: boolean;
  published?: boolean;
}

/**
 * Nome único por teste: o demo é compartilhado, então nada pode depender
 * de dados criados por outra pessoa ou por outra execução.
 */
export function uniqueVacancyName(prefix = 'PW Vaga'): string {
  return `${prefix} ${randomUUID().slice(0, 8)}`;
}
