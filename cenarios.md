# Cenários de teste — OrangeHRM (Login e Recruitment › Vacancies)

Sistema sob teste: https://opensource-demo.orangehrmlive.com/

Os cenários foram levantados como **caixa preta**: só pelo comportamento observável
da interface, sem olhar o código-fonte do OrangeHRM. As técnicas usadas em cada
cenário estão indicadas na coluna "Técnica":

| Sigla | Técnica |
|-------|---------|
| **PE** | Particionamento de equivalência (classes válidas e inválidas) |
| **VL** | Análise de valor limite |
| **TD** | Tabela de decisão (combinação de entradas) |
| **TE** | Transição de estado (fluxo entre telas / sessão) |
| **CU** | Caso de uso / fluxo principal ponta a ponta |
| **SE** | Suposição de erro (error guessing) |

Prioridade: **Alta** = caminho crítico do negócio (entra no smoke), **Média** = regra de
validação importante, **Baixa** = comportamento secundário.

## Critérios para escolher o que automatizar

Um cenário entrou na lista quando atende pelo menos um destes critérios:

1. **Repetível e determinístico** — o resultado esperado é sempre o mesmo, dado o mesmo estado.
2. **Alto risco / alto uso** — login e CRUD de vagas são o núcleo da funcionalidade.
3. **Regressão provável** — validações de formulário quebram com facilidade em mudanças de front.
4. **Independente** — cada teste cria os próprios dados (nome único) e limpa o que criou,
   porque o demo é público e compartilhado por outras pessoas ao mesmo tempo.

Ficaram de fora (melhor testar manualmente ou em outro nível): layout/visual,
"Esqueceu a senha" (depende de e-mail), RSS/Web Page URL (sistema externo) e
anexos da vaga (fora do escopo pedido).

---

## 1. Login

Pré-condição comum: usuário não autenticado, na página `/auth/login`.
Credenciais válidas do demo: `Admin` / `admin123`.

| ID | Cenário | Técnica | Dados | Resultado esperado | Prioridade |
|----|---------|---------|-------|--------------------|------------|
| LOGIN-01 | Login com credenciais válidas | PE (válida), CU | `Admin` / `admin123` | Redireciona para `/dashboard/index`, título "Dashboard" visível, nome do usuário no menu | Alta |
| LOGIN-02 | Login com senha inválida | PE (inválida) | `Admin` / `senhaErrada` | Permanece no login, alerta "Invalid credentials" | Alta |
| LOGIN-03 | Login com usuário inexistente | PE (inválida) | `usuarioInexistente` / `admin123` | Alerta "Invalid credentials" | Alta |
| LOGIN-04 | Usuário e senha em branco | VL (vazio), TD | `""` / `""` | "Required" abaixo dos dois campos, sem requisição de login | Média |
| LOGIN-05 | Somente usuário em branco | TD | `""` / `admin123` | "Required" só no campo Username | Média |
| LOGIN-06 | Somente senha em branco | TD | `Admin` / `""` | "Required" só no campo Password | Média |
| LOGIN-07 | Usuário não diferencia maiúsculas | PE, SE | `admin` / `admin123` | Login com sucesso | Baixa |
| LOGIN-08 | Senha diferencia maiúsculas | PE, SE | `Admin` / `ADMIN123` | Alerta "Invalid credentials" | Média |
| LOGIN-09 | Espaço antes do usuário | SE | `" Admin"` / `admin123` | Alerta "Invalid credentials" (não faz trim) | Baixa |
| LOGIN-10 | Logout encerra a sessão | TE | — | Após Logout volta para `/auth/login`; ao acessar `/dashboard/index` de novo é mandado ao login | Alta |
| LOGIN-11 | Rota protegida sem sessão | TE | acessar `/recruitment/viewJobVacancy` | Redireciona para `/auth/login` | Alta |

Tabela de decisão dos campos obrigatórios (LOGIN-04 a 06, LOGIN-01/02):

| Username preenchido | Password preenchido | Credenciais corretas | Resultado |
|:-:|:-:|:-:|---|
| N | N | — | Required nos dois |
| N | S | — | Required em Username |
| S | N | — | Required em Password |
| S | S | N | Invalid credentials |
| S | S | S | Dashboard |

---

## 2. Recruitment › Vacancies

Pré-condição comum: usuário `Admin` autenticado.
Campos do formulário: **Vacancy Name\***, **Job Title\***, Description, **Hiring Manager\***
(autocomplete), Number of Positions, Active (switch), Publish in RSS Feed and Web Page (switch).

### 2.1 Adição

| ID | Cenário | Técnica | Dados | Resultado esperado | Prioridade |
|----|---------|---------|-------|--------------------|------------|
| VAC-ADD-01 | Adicionar vaga com todos os campos | CU, PE (válida) | nome único, job title, hiring manager, descrição, 3 posições | Redireciona para "Edit Vacancy" (`/addJobVacancy/{id}`) com os dados salvos; vaga aparece na listagem | Alta |
| VAC-ADD-02 | Adicionar vaga só com obrigatórios | PE (válida), VL | nome, job title, hiring manager | Salva com sucesso | Alta |
| VAC-ADD-03 | Salvar formulário vazio | VL (vazio) | — | "Required" em Vacancy Name, Job Title e Hiring Manager | Média |
| VAC-ADD-04 | Nome de vaga duplicado | PE (inválida), SE | nome de uma vaga já existente | "Already exists" no campo Vacancy Name | Média |
| VAC-ADD-05 | Number of Positions — limites válidos | VL | `1`, `99` | Sem mensagem de erro | Média |
| VAC-ADD-06 | Number of Positions — limites inválidos | VL | `0`, `100` | "Should be a number between 1-99" | Média |
| VAC-ADD-07 | Number of Positions — não numérico | PE (inválida) | `abc`, `-1`, `1.5` | "Should be a numeric value" | Média |
| VAC-ADD-08 | Hiring Manager digitado sem escolher da lista | SE | texto livre | "Invalid" no Hiring Manager | Média |
| VAC-ADD-09 | Cancelar a adição | TE | preencher e clicar Cancel | Volta para a listagem e nada é criado | Baixa |

### 2.2 Edição

| ID | Cenário | Técnica | Dados | Resultado esperado | Prioridade |
|----|---------|---------|-------|--------------------|------------|
| VAC-EDIT-01 | Editar nome, descrição e posições | CU | vaga criada no setup | Toast "Successfully Saved"; listagem mostra o novo nome | Alta |
| VAC-EDIT-02 | Formulário de edição carrega os dados atuais | PE | vaga criada no setup | Campos preenchidos com os valores da vaga | Média |
| VAC-EDIT-03 | Inativar uma vaga | TE | desligar "Active" | Vaga aparece na pesquisa por Status "Closed" (vagas fechadas saem do filtro "Vacancy") | Média |
| VAC-EDIT-04 | Apagar campo obrigatório na edição | VL (vazio) | limpar Vacancy Name | "Required", nada é salvo | Média |

### 2.3 Pesquisa

| ID | Cenário | Técnica | Dados | Resultado esperado | Prioridade |
|----|---------|---------|-------|--------------------|------------|
| VAC-SEARCH-01 | Pesquisar por Vacancy | PE (válida) | vaga criada no setup | Exatamente 1 registro com o nome pesquisado | Alta |
| VAC-SEARCH-02 | Pesquisar por Job Title | PE | job title da vaga criada | Todas as linhas têm esse Job Title; a vaga criada está entre elas | Média |
| VAC-SEARCH-03 | Pesquisar por Status | PE | Status = Closed | Todas as linhas têm Status "Closed" | Média |
| VAC-SEARCH-04 | Combinação de filtros sem resultado | TD | Vacancy ativa + Status Closed | "No Records Found" | Média |
| VAC-SEARCH-05 | Reset limpa os filtros | TE | aplicar filtro e clicar Reset | Filtros voltam a "-- Select --" e a listagem volta ao total | Baixa |

### 2.4 Deleção

| ID | Cenário | Técnica | Dados | Resultado esperado | Prioridade |
|----|---------|---------|-------|--------------------|------------|
| VAC-DEL-01 | Excluir vaga pela linha da tabela | CU | vaga criada no setup | Diálogo "Are you Sure?"; após "Yes, Delete" toast "Successfully Deleted" e a vaga some | Alta |
| VAC-DEL-02 | Cancelar exclusão | TE | "No, Cancel" | Vaga continua na listagem | Média |
| VAC-DEL-03 | Excluir várias vagas selecionadas | CU | 2 vagas criadas no setup | "Delete Selected" remove as duas | Média |

---

## Rastreabilidade (cenário → teste)

| Arquivo | Cenários |
|---------|----------|
| `tests/login/login.spec.ts` | LOGIN-01 a LOGIN-11 |
| `tests/recruitment/vacancy-add.spec.ts` | VAC-ADD-01 a VAC-ADD-09 |
| `tests/recruitment/vacancy-edit.spec.ts` | VAC-EDIT-01 a VAC-EDIT-04 |
| `tests/recruitment/vacancy-search.spec.ts` | VAC-SEARCH-01 a VAC-SEARCH-05 |
| `tests/recruitment/vacancy-delete.spec.ts` | VAC-DEL-01 a VAC-DEL-03 |

Os testes de prioridade Alta levam a tag `@smoke` e rodam com `npm run test:smoke`.
