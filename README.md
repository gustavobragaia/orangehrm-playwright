# OrangeHRM — testes E2E com Playwright

Automação dos cenários de **Login** e **Recruitment › Vacancies** (adição, edição,
pesquisa e deleção) do demo https://opensource-demo.orangehrmlive.com/.

A lista de cenários e as técnicas de caixa preta usadas estão em [cenarios.md](cenarios.md).

## Como rodar

```bash
npm install
npx playwright install chromium
npm test              # tudo
npm run test:smoke    # só os cenários @smoke (prioridade alta)
npm run report        # abre o relatório HTML
```

## Estrutura

```
pages/               Page Objects (LoginPage, DashboardPage, VacanciesPage, VacancyFormPage)
pages/components/    Componentes reutilizáveis (campo, select, autocomplete, toast)
fixtures/            Fixtures do Playwright que entregam os Page Objects e os dados
api/                 VacancyApi: cria e remove vagas pela API para preparar/limpar dados
data/                Credenciais, mensagens esperadas e gerador de nomes únicos
tests/auth.setup.ts  Login único; a sessão é reaproveitada pelos testes de Recruitment
tests/login/         Cenários LOGIN-*
tests/recruitment/   Cenários VAC-*
```

## Decisões

- **Page Object + fixtures**: os testes não conhecem seletores, só ações e asserções de negócio.
- **Seletores por papel/texto** (`getByRole`, label do campo) em vez de classes geradas.
- **Sem `waitForTimeout`**: as esperas são por estado (resposta da API, URL, elemento visível).
- **Dados isolados**: o demo é público e compartilhado. Cada teste cria a própria vaga com
  nome único e o fixture `vacancyApi` remove tudo no final, mesmo quando o teste falha.
- **Setup pela API, verificação pela UI**: a API só prepara o cenário; o comportamento
  testado é sempre exercitado na interface.
- Trace, screenshot e vídeo são guardados só nas falhas; 1 retry local por instabilidade do demo.
