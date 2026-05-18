# YMDA Manager

Sistema de gestão de produção industrial: painel administrativo web e interface de chão de fábrica (IHM) para totens Raspberry Pi.

## Documentação

Toda a documentação técnica está em **[docs/](./docs/README.md)**:

- [Índice e início rápido](./docs/README.md)
- [Arquitetura API-first](./docs/ARQUITETURA_API.md)
- [Domínio](./docs/DOMINIO.md)
- [API](./docs/API.md)
- [Autenticação](./docs/AUTENTICACAO.md)
- [Regras de negócio](./docs/REGRAS_NEGOCIO.md)
- [Banco de dados](./docs/BANCO_DADOS.md)
- [Deploy](./docs/DEPLOY.md)
- [IHM](./docs/IHM.md)

## Início rápido

```bash
docker compose up --build
```

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API / Swagger | http://localhost:8001/docs |

## Estrutura

- `Backend/` — API FastAPI + PostgreSQL
- `Web/` — Frontend React (Vite)
- `docs/` — Documentação
