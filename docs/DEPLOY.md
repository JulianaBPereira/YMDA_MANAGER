# Deploy e ambientes

## Modos de deploy

### 1. Stack completa (`docker-compose.yml`)

Inclui **Postgres + backend + frontend** na mesma rede Docker.

```bash
docker compose up --build -d
```

| Serviço | Container | Porta host padrão |
|---------|-----------|-------------------|
| postgres | `ymda_manager_postgres` | 5432 |
| backend | `ymda_manager_backend` | 8001 |
| frontend | `ymda_manager_frontend` | 5173 |

O Postgres monta `Backend/database/database.sql` na primeira subida.

### 2. Cliente (`docker-compose-client.yml`)

Apenas **backend + frontend**. O Postgres fica **fora** do compose (servidor existente).

```bash
docker compose -f docker-compose-client.yml up --build -d
```

Postgres padrão: `host.docker.internal:5432` (Windows/Mac Docker Desktop).

## Variáveis de ambiente

### Postgres (backend e compose)

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `POSTGRES_HOST` | `postgres` (full) / `host.docker.internal` (client) | Host do banco |
| `POSTGRES_PORT` | `5432` | Porta |
| `POSTGRES_DB` | `ymda_manager` | Nome do database |
| `POSTGRES_USER` | `postgres` | Usuário |
| `POSTGRES_PASSWORD` | `Postgres` | Senha |

### Portas (compose)

| Variável | Padrão |
|----------|--------|
| `POSTGRES_PORT` | `5432` |
| `BACKEND_PORT` | `8001` |
| `FRONTEND_PORT` | `5173` |

### Frontend

| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL` | URL base do backend **sem** `/api` (ex.: `http://backend:8001` no Docker, `http://localhost:8001` no browser local) |

O browser do usuário precisa alcançar essa URL. Em produção com nginx, configure proxy ou `VITE_API_URL` apontando para o host público da API.

## Arquivo `.env` (desenvolvimento local)

Crie `Backend/.env`:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=ymda_manager
POSTGRES_USER=postgres
POSTGRES_PASSWORD=Postgres
```

## Build das imagens

### Backend (`Backend/Dockerfile`)

- Base: `python:3.12-slim`
- Contexto de build: **raiz do repositório**
- Comando: `uvicorn Backend.app:app --host 0.0.0.0 --port 8001`

### Frontend (`Web/Dockerfile`)

- Base: `node:20-alpine`
- Modo atual: **`npm run dev`** (Vite dev server na porta 5173)

Para produção estável, considere build estático (`npm run build`) + nginx (`Web/nginx.conf` já existe no repo).

## Rede

Compose cria a rede `ymda-manager-network` (ou `ymda-manager-client-network` no client).

Serviços se resolvem pelo nome (`backend`, `postgres`).

## Healthcheck

Postgres no compose full usa `pg_isready` antes do backend subir (`depends_on: condition: service_healthy`).

## Raspberry Pi / totem

1. Use `docker-compose-client.yml` ou instale backend no Pi.
2. Aponte `POSTGRES_HOST` para o servidor central.
3. Garanta que `/proc/cpuinfo` esteja disponível para registro do serial (ou cadastre dispositivo manualmente em `/dispositivos-raspberry`).
4. Acesse a IHM em `http://<ip-do-pi>:5173/ihm/login`.
5. Teclado virtual: `VirtualKeyboardProvider` global em `main.tsx`.

## Checklist pós-deploy

- [ ] Alterar senhas dos usuários seed
- [ ] Confirmar timezone do Postgres (`America/Manaus`)
- [ ] Testar `GET /docs` e login admin
- [ ] Testar fluxo RFID na IHM
- [ ] Verificar WebSocket do dashboard atrás de proxy (upgrade WS)
- [ ] Backup agendado do volume `ymda_manager_postgres_data`

## Troubleshooting

| Problema | Causa provável |
|----------|----------------|
| Frontend não chama API | `VITE_API_URL` incorreta para o browser (use IP/host acessível, não só nome Docker interno) |
| Backend não conecta DB | Host/porta/credenciais; firewall |
| Import Error no Linux | Pastas `Controller` vs `controller` — alinhar case dos diretórios |
| Serial não registrado | Pi sem serial válido em `/proc/cpuinfo` — cadastrar dispositivo manualmente |
| Schema incompleto | Subir backend uma vez (startup ALTER) ou reaplicar SQL |

## Produção com nginx

`Web/nginx.conf` pode servir o build estático e fazer proxy de `/api` para o backend. Ajuste `VITE_API_URL` no build para o domínio público ou use paths relativos via proxy no mesmo host.
