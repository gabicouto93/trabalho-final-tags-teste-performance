# Teste de performance - Documentação

> **Este projeto foi desenvolvido para o trabalho final da disciplina de Automação de Testes de Performance da pós-graduação em Automação de Teste de Software do Julio de Lima em parceria com a faculdade Facint.**

## Visão Geral

Este projeto consiste em uma API de banco digital moderna, desenvolvida para fins didáticos, suportando arquitetura REST e GraphQL. O sistema oferece funcionalidades essenciais como autenticação via JWT, gerenciamento de contas e realização de transferências financeiras.

O foco principal deste repositório é a demonstração de **Testes de Performance** utilizando a ferramenta **K6**.

Atualmente, o projeto conta com:
- **API REST e GraphQL** funcionais.
- **Testes de Performance** implementados com K6, cobrindo cenários de carga, estresse e fluxos completos de usuário.
- **Relatórios de Performance** gerados automaticamente em HTML.

---

## Testes de Performance com K6

Este projeto utiliza o **K6** para a execução de testes de performance, validando a robustez e escalabilidade da API. Abaixo, detalhamos como os principais conceitos do K6 foram aplicados no código.

### 1. Thresholds (Limiares)
Definem os critérios de aceitação para o teste. Se as métricas ultrapassarem esses limites, o teste falha.
*Arquivo: `tests/login.js`*
```javascript
thresholds: {
    http_req_duration: ['p(95)<3000', 'max<5000'], // 95% das requisições devem ser < 3s
    http_req_failed: ['rate<0.01'],   // Taxa de erro deve ser inferior a 1%
},
```

### 2. Checks (Verificações)
Validam se a resposta da requisição está correta (status code, corpo da resposta, etc.). Diferente dos thresholds, checks não falham o teste automaticamente, apenas registram o sucesso/falha.
*Arquivo: `tests/fluxo-completo.js`*
```javascript
check(res, {
    'status contas é 200': (r) => r.status === 200,
    'lista de contas não vazia': (r) => r.json().contas && r.json().contas.length >= 2
});
```

### 3. Helpers
Funções auxiliares reutilizáveis para manter o código limpo, como a função de login que obtém o token.
*Arquivo: `tests/fluxo-completo.js`*
```javascript
import { obterToken } from '../helpers/autenticacao.js';
// ...
const token = obterToken(user);
```

### 4. Trends (Tendências)
Métricas personalizadas para acompanhar dados específicos, como o tempo de duração de um fluxo de login.
*Arquivo: `tests/login.js`*
```javascript
import { Trend } from 'k6/metrics';
const loginDuration = new Trend('login_duration');
// ...
loginDuration.add(res.timings.duration);
```

### 5. Faker
Geração de dados dinâmicos e aleatórios para os testes, evitando dados estáticos repetitivos.
*Arquivo: `tests/login.js`*
```javascript
import { randomUUID } from '../utils/faker.js';
// ...
const requestId = randomUUID();
```

### 6. Variável de Ambiente
Permite configurar parâmetros do teste (como a URL base) externamente, facilitando a execução em diferentes ambientes (local, dev, prod).
*Arquivo: `utils/variaveis.js`*
```javascript
export const BASE_URL = __ENV.BASE_URL || configLocal.baseUrl;
```

### 7. Stages (Estágios)
Definem o perfil de carga do teste, simulando o comportamento real de usuários (Ramp-up, Platô, Ramp-down).
*Arquivo: `tests/login.js`*
```javascript
stages: [
    { duration: '10s', target: 50 }, // Sobe para 50 VUs em 10s
    { duration: '30s', target: 50 }, // Mantém 50 VUs por 30s
    { duration: '10s', target: 0 },  // Desce para 0 VUs em 10s
],
```

### 8. Reaproveitamento de Resposta
Captura dados de uma resposta (ex: ID de uma conta) para usar na requisição seguinte, simulando um fluxo real.
*Arquivo: `tests/fluxo-completo.js`*
```javascript
if (res.status === 200) {
    const contas = res.json().contas;
    contaOrigemId = contas[0].id; // Captura ID para usar na transferência
}
```

### 9. Uso de Token de Autenticação
Injeção do token JWT no cabeçalho das requisições para acessar rotas protegidas.
*Arquivo: `tests/fluxo-completo.js`*
```javascript
const headers = {
    'Authorization': `Bearer ${data.token}`,
    'Content-Type': 'application/json',
};
```

### 10. Data-Driven Testing
Execução de testes com base em uma massa de dados externa (arquivo JSON), permitindo testar com múltiplos usuários diferentes.
*Arquivo: `tests/login.js`*
```javascript
const usuarios = new SharedArray('usuarios', function () {
    return JSON.parse(open('../fixtures/usuarios.json'));
});
// ...
const user = usuarios[Math.floor(Math.random() * usuarios.length)];
```

### 11. Groups (Grupos)
Organizam o script de teste em blocos lógicos, facilitando a leitura e a análise dos resultados por seção.
*Arquivo: `tests/fluxo-completo.js`*
```javascript
group('1. Consulta Contas', function () {
    // Requisições de consulta
});
group('2. Realiza Transferência', function () {
    // Requisições de transferência
});
```

### Observações Importantes
- **Foco em Performance**: Os testes visam validar a capacidade de carga e estresse da API.
- **Relatórios HTML**: Cada execução gera um relatório detalhado (ex: `login-report.html`) na raiz do projeto.
- **Ambiente Local**: Os testes são executados contra a API rodando localmente (`localhost:3000`).

---

## Pré-requisitos

Antes de iniciar, certifique-se de que você tenha as seguintes ferramentas instaladas:

- [Node.js](https://nodejs.org/) (v14 ou superior)
- [MySQL](https://www.mysql.com/) (para o banco de dados da API)
- **K6**: https://k6.io/docs/get-started/installation/.

---

## Configuração do Ambiente (API)

### 1. Banco de Dados
Crie um banco de dados MySQL chamado `banco` e configure as tabelas conforme o script SQL (verifique se o serviço do MySQL está rodando).

### 2. Variáveis de Ambiente
Crie um arquivo `.env` na raiz com as configurações do banco (ex: `DB_HOST=localhost`, `DB_USER=root`, etc.).

---

## Executando a API

1. Instale as dependências do projeto:
   ```bash
   npm install
   ```

2. Inicie a API REST (necessária para os testes):
   ```bash
   npm run rest-api
   ```
   *A API estará disponível em http://localhost:3000*

---

## Executando os Testes de Performance

### Opção A: Script Automatizado (Recomendado)
Utilize o script `run_with_report.sh` para rodar o teste e gerar o relatório HTML automaticamente.

**No Terminal (Git Bash / Linux):**
```bash
# Sintaxe: ./run_with_report.sh <arquivo_teste> <nome_relatorio>
bash run_with_report.sh tests/login.js login-report.html
```

### Opção B: Task do VS Code
1. Abra o arquivo de teste desejado (ex: `tests/fluxo-completo.js`).
2. Pressione `Ctrl+Shift+P` (ou `F1`).
3. Digite `Run Task` e selecione **K6: Run Current File with Report**.

### Opção C: Manualmente
```bash
./k6.exe run tests/login.js
```

---

## Estrutura do Projeto

```plaintext
project/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   └── contaModel.js
│   ├── services/
│   │   ├── contaService.js
│   │   ├── loginService.js
│   │   └── transferenciaService.js
│   └── utils/
│       └── errorHandler.js
├── rest/
│   ├── app.js
│   ├── controllers/
│   │   ├── contaController.js
│   │   ├── loginController.js
│   │   └── transferenciaController.js
│   ├── middlewares/
│   │   └── authMiddleware.js
│   ├── routes/
│   │   ├── contaRoutes.js
│   │   ├── loginRoutes.js
│   │   └── transferenciaRoutes.js
├── graphql/
│   ├── app.js
│   ├── resolvers/
│   │   ├── index.js
│   │   ├── queryResolvers.js
│   │   └── mutationResolvers.js
│   ├── schema/
│   │   └── index.js
│   ├── typeDefs.js
├── tests/
│   ├── contas.js
│   ├── estresse-extrato.js
│   ├── fluxo-completo.js
│   ├── login.js
│   └── transferencias.js
├── config/
│   └── serverConfig.js
├── .env
├── package.json
└── README.md
```
