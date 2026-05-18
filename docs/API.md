# API REST e WebSocket

Base URL: `http://<host>:8001/api`

Documentação interativa (OpenAPI): **http://localhost:8001/docs**

## Prefixos por recurso

Todos os routers abaixo são montados com `prefix="/api"` em `app.py`.

| Recurso | Prefixo | Arquivo controller |
|---------|---------|-------------------|
| Funcionários | `/funcionarios` | `funcionarios_controller.py` |
| Produtos | `/produtos` | `produtos_controller.py` |
| Peças | `/pecas` | `pecas_controller.py` |
| Modelos | `/modelos` | `modelos_controller.py` |
| Linhas / sublinhas | `/linhas` | `linhas_controller.py` |
| Dispositivos | `/dispositivos` | `dispositivos_controller.py` |
| Postos | `/postos` | `postos_controller.py` |
| Operações | `/operacoes` | `operacoes_controller.py` |
| Registros de produção | `/registros-producao` | `registros_producao_controller.py` |
| Turnos | `/turnos` | `turnos_controller.py` |
| Usuários | `/usuarios` | `usuarios_controller.py` |
| IHM (chão de fábrica) | `/ihm` | `ihm_controller.py` |

## Cliente frontend

- URL base: `Web/src/api/api.ts` → `API_BASE_URL` (`VITE_API_URL` + `/api` ou hostname:8001).
- Por domínio: `Web/src/services/*.ts` (ex.: `postos.ts`, `linhas.ts`).
- IHM e produção: `ihmAPI` e `producaoAPI` em `api.ts`.
- Dashboard: `dashboardAPI` e WebSocket.

## Autenticação nas requisições

O painel admin envia o header opcional:

```
X-User-Id: <id do usuário logado>
```

Lido de `localStorage.user` após login. Detalhes em [AUTENTICACAO.md](./AUTENTICACAO.md).

Os endpoints `/ihm/*` **não** exigem esse header.

## Formato de erros

O `fetchAPI` trata respostas não OK nesta ordem:

1. `erro` (JSON)
2. `error` (JSON)
3. `message` (JSON)
4. `detail` (string do FastAPI)
5. `Erro <status>`

Exemplo FastAPI:

```json
{ "detail": "Funcionário não encontrado" }
```

## Status HTTP comuns

| Código | Uso |
|--------|-----|
| 200 | Sucesso com corpo |
| 201 | Criado |
| 204 | Sucesso sem corpo (ex.: PUT comentário) |
| 400 | Regra de negócio (`ValueError` no service) |
| 401 | Login inválido |
| 404 | Recurso não encontrado |

## Endpoints IHM (produção)

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/ihm/rfid/{codigo}` | Valida tag RFID |
| GET | `/ihm/contexto-operacao/{operador}` | Operações para o operador (`operador` = nome do funcionário) |
| GET | `/ihm/producao/registro-aberto?posto=&funcionario_matricula=` | Registro em aberto no posto |
| POST | `/ihm/producao/entrada` | Inicia registro |
| POST | `/ihm/producao/saida` | Finaliza registro |

### Entrada (`POST /ihm/producao/entrada`)

```json
{
  "posto": "Posto 1",
  "funcionario_matricula": "12345",
  "operacao": "7",
  "modelo_codigo": null,
  "peca": null,
  "codigo": null
}
```

Resolução da operação (em ordem):

1. Se `operacao` informado → ID da operação.
2. Senão, se `posto` → primeira operação daquele posto.
3. Senão → primeira operação cadastrada.

### Saída (`POST /ihm/producao/saida`)

```json
{
  "registro_id": 42,
  "posto": "Posto 1",
  "funcionario_matricula": "12345",
  "quantidade": 10,
  "comentario": "opcional"
}
```

Se `registro_id` omitido, busca o registro em aberto por posto + matrícula.

## Registros de produção (admin)

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/registros-producao/` | Lista todos (enriquecidos) |
| GET | `/registros-producao/abertos` | Apenas em aberto |
| GET | `/registros-producao/dashboard/postos` | Grid do dashboard |
| PUT | `/registros-producao/{id}/comentario` | Atualiza comentário (204) |
| POST | `/registros-producao/{id}/finalizar` | Finaliza registro |
| DELETE | `/registros-producao/{id}` | Remove registro |

## WebSocket — dashboard

```
ws://<host>:8001/api/registros-producao/ws/dashboard
```

- Primeira mensagem do servidor: `{"type":"connected","channel":"dashboard"}`
- Atualizações da IHM: `{"type":"dashboard_refresh","action":"entrada"|"saida",...}`

No frontend: `getDashboardWebSocketUrl()` em `api.ts`.

## Exemplos curl

### Login

```bash
curl -X POST http://localhost:8001/api/usuarios/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"senha\":\"SUA_SENHA\"}"
```

### Validar RFID

```bash
curl http://localhost:8001/api/ihm/rfid/ABC123TAG
```

### Listar postos

```bash
curl http://localhost:8001/api/postos
```

## CORS

O backend permite `allow_origins=["*"]` em `app.py`. Adequado para rede interna; revise antes de expor na internet pública.
