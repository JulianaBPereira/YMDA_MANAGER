# Documentação — YMDA Manager

Sistema de gestão de produção industrial: painel administrativo web e interface de chão de fábrica (IHM) em totens Raspberry Pi.

## Índice

| Documento | Conteúdo |
|-----------|----------|
| [ARQUITETURA_API.md](./ARQUITETURA_API.md) | Camadas do backend e frontend, API-first, convenções |
| [DOMINIO.md](./DOMINIO.md) | Entidades, relacionamentos e hierarquia da fábrica |
| [API.md](./API.md) | Endpoints, erros, WebSocket e exemplos |
| [AUTENTICACAO.md](./AUTENTICACAO.md) | Login, roles, headers e limitações |
| [REGRAS_NEGOCIO.md](./REGRAS_NEGOCIO.md) | Validações e regras implementadas no código |
| [BANCO_DADOS.md](./BANCO_DADOS.md) | Schema, seed, migrações no startup |
| [DEPLOY.md](./DEPLOY.md) | Docker, variáveis de ambiente, ambientes |
| [IHM.md](./IHM.md) | Fluxo do operador, RFID, sessão e telas |

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | React, TypeScript, Vite, Tailwind, React Router |
| Backend | FastAPI, SQLAlchemy, Uvicorn |
| Banco | PostgreSQL 16 |
| Infra | Docker Compose |

## Estrutura do repositório

```
YMDA_MANAGER/
├── Backend/          # API FastAPI
│   ├── controller/   # Rotas HTTP
│   ├── services/     # Regras de negócio
│   ├── DAO/          # Acesso a dados
│   ├── Model/        # Entidades SQLAlchemy
│   ├── schema/       # DTOs Pydantic
│   └── database/     # database.sql e conexão
├── Web/              # Frontend React
│   └── src/
│       ├── Pages/    # Telas (admin e IHM)
│       ├── services/ # Clientes HTTP por domínio
│       └── api/      # fetchAPI central
├── docs/             # Esta documentação
├── docker-compose.yml
└── docker-compose-client.yml
```

## Início rápido

### Com Docker (stack completa)

Na raiz do projeto:

```bash
docker compose up --build
```

| Serviço | URL padrão |
|---------|------------|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8001 |
| Swagger (OpenAPI) | http://localhost:8001/docs |
| PostgreSQL | localhost:5432 |

### Desenvolvimento local

1. Subir o Postgres (via Docker ou instalação local) e aplicar `Backend/database/database.sql`.
2. Criar `Backend/.env` com as variáveis descritas em [DEPLOY.md](./DEPLOY.md).
3. Backend: `uvicorn Backend.app:app --reload --host 0.0.0.0 --port 8001` (na raiz do repo).
4. Frontend: em `Web/`, `npm install` e `npm run dev`.

## Papéis no sistema

| Papel | Uso |
|-------|-----|
| **admin** | Cadastros, dashboard, linhas, postos, operações |
| **master** | Tudo do admin + gestão de usuários |
| **operador** | Usuário de sistema (ex.: RFID); não usa o painel admin da mesma forma |
| **Funcionário** | Pessoa da produção identificada por tag RFID na IHM |

## Links úteis no código

- Rotas do frontend: `Web/src/App.tsx`
- Cliente HTTP: `Web/src/api/api.ts`
- Entrada da API: `Backend/app.py`
- Schema SQL inicial: `Backend/database/database.sql`
