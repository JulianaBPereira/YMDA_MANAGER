# Arquitetura API-first

O YMDA Manager segue uma arquitetura em que **o frontend nunca acessa o banco de dados diretamente**. Toda persistência passa pela API REST (e WebSocket onde aplicável).

## Diagrama geral

```
┌─────────────────┐     HTTP / WS      ┌─────────────────┐     SQL      ┌──────────────┐
│  Web (React)    │ ◄──────────────► │  Backend        │ ◄──────────► │  PostgreSQL  │
│  Vite           │   /api/*         │  FastAPI        │              │              │
└─────────────────┘                  └─────────────────┘              └──────────────┘
       │                                      │
       │  Pages / Components                  │  controller → service → DAO → Model
       │  services/*.ts                       │
       └─ api/api.ts (fetchAPI)               └─ Schema (Pydantic)
```

## Backend — camadas

| Camada | Pasta | Responsabilidade |
|--------|-------|------------------|
| **Controller** | `Backend/controller/` | Rotas FastAPI, status HTTP, `Depends(get_db)` |
| **Service** | `Backend/services/` | Regras de negócio, orquestração, `ValueError` → 400 |
| **DAO** | `Backend/DAO/` | Queries SQLAlchemy, commit/rollback |
| **Model** | `Backend/Model/` | Tabelas mapeadas (`declarative_base`) |
| **Schema** | `Backend/schema/` | Request/response Pydantic (quando separado do controller) |

Fluxo típico:

```
Request → Controller → Service → DAO → Model/DB
                ↓
         HTTPException ou JSON
```

### Registro de rotas

Em `Backend/app.py`, todos os routers usam o prefixo **`/api`**:

```python
app.include_router(postos_router, prefix="/api")
# Ex.: router interno prefix="/postos" → URL final /api/postos
```

### Sessão de banco

`Backend/database/database.py` expõe `get_db()` como dependência FastAPI (generator com `yield` e `finally: db.close()`).

### Startup

No evento `startup` de `app.py`:

- Executa `ALTER TABLE ... IF NOT EXISTS` para colunas adicionadas após o SQL inicial.
- Registra automaticamente o dispositivo Raspberry local (quando o serial está disponível).

## Frontend — camadas

| Camada | Pasta | Responsabilidade |
|--------|-------|------------------|
| **Pages** | `Web/src/Pages/` | Telas e fluxos (admin e `Pages/IHM/`) |
| **Components** | `Web/src/Components/` | UI reutilizável, modais, formulários |
| **services** | `Web/src/services/` | Funções por domínio (`listarPostos`, etc.) |
| **api** | `Web/src/api/api.ts` | `fetchAPI`, URL base, headers, IHM e dashboard |
| **contexts** | `Web/src/contexts/` | Auth, teclado virtual (IHM) |

## Regras para contribuidores

### Faça

- Use `fetchAPI` em `Web/src/api/api.ts` ou os módulos em `Web/src/services/`.
- Adicione endpoints no backend seguindo **controller + service + DAO + model/schema**.
- Mantenha tipos TypeScript nas interfaces dos `services/*.ts`.
- Consulte o Swagger em `/docs` após subir o backend.

### Não faça

- Importar ou executar SQL no frontend.
- Adicionar dependências de banco no `Web/package.json` (psycopg2, sqlalchemy, etc.).
- Chamar o Postgres diretamente a partir do React.

## Dois frontends na mesma API

| Modo | Rotas React | Autenticação |
|------|-------------|--------------|
| **Admin** | `/`, `/linhas`, `/postos`, … | Login em `/admin`, `ProtectedRoute`, `localStorage.user` |
| **IHM** | `/ihm/login`, `/ihm/leitor`, … | Tag RFID + sessão `ihm_sessao`; endpoints `/api/ihm/*` |

Detalhes da IHM: [IHM.md](./IHM.md).  
Detalhes de auth: [AUTENTICACAO.md](./AUTENTICACAO.md).

## Comunicação em tempo real

O dashboard admin usa **WebSocket** para atualizar quando há entrada/saída de produção na IHM:

- URL (relativa ao backend): `ws://<host>:8001/api/registros-producao/ws/dashboard`
- Helper no frontend: `getDashboardWebSocketUrl()` em `api.ts`
- Broadcast disparado em `ihm_controller` após entrada/saída

## Convenção de pastas (atenção Linux)

`Backend/app.py` importa pacotes com **PascalCase** (`Controller`, `Database`, `Services`). No repositório as pastas podem aparecer em minúsculas (`controller`, `database`, `services`). No Windows isso costuma funcionar; em **Linux/Docker** os imports devem coincidir com o nome real das pastas. Padronize antes de deploy em produção.

## Referência no código

O comentário em `Web/src/main.tsx` aponta para este arquivo como guia de arquitetura API-first.
