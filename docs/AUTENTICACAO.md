# Autenticação e autorização

O sistema usa **dois modelos distintos**: usuários do painel admin e funcionários na IHM (RFID).

## Usuários do painel (admin)

### Login

- **Endpoint:** `POST /api/usuarios/login`
- **Body:** `{ "username", "senha" }`
- **Resposta:** `{ id, username, nome, role }` (sem token JWT)

Implementação: `Backend/services/usuarios_service.py` (bcrypt via passlib).

### Persistência no frontend

Após login (`AuthContext`):

1. Objeto salvo em `localStorage` com chave `user`.
2. Chamadas via `fetchAPI` enviam header **`X-User-Id`** com o `id` do usuário.

```typescript
// Web/src/api/api.ts
headers['X-User-Id'] = usuarioId
```

> **Importante:** O backend hoje **não valida** de forma centralizada esse header em todos os endpoints. A proteção principal está no **frontend** (`ProtectedRoute`). Trate a API como confiável apenas em rede controlada ou evolua para tokens/sessão server-side.

### Roles

| Role | Rotas típicas (App.tsx) |
|------|-------------------------|
| `admin` | Dashboard, funcionários, linhas, postos, operações, cadastros |
| `master` | Tudo do admin + `/usuarios` |
| `operador` | Conta de sistema; painel admin restrito |

`ProtectedRoute` (`Web/src/Components/ProtectedRoute.tsx`):

- `onlyAdmin`: permite `admin` e `master`.
- `allowedRoles`: lista explícita (ex.: `['master']` em usuários).
- Sem login: redireciona para `/login` (que redireciona para `/admin`).

### Logout

Remove `user` do `localStorage` via `AuthContext.logout()`.

### Cadastro e gestão

- Cadastro público: rota `/cadastro-usuario` (ver fluxo em `CadastroUsuario.tsx`).
- CRUD completo: `/usuarios` (somente `master`).

### Exclusão de usuário

Soft delete: `ativo = false` e `data_remocao` preenchido (`usuarios_service`).

## Funcionários (IHM / produção)

Não fazem login com senha no painel. Identificação por:

- **Tag RFID** → `GET /api/ihm/rfid/{codigo}`
- Validação em `FuncionarioService.buscar_por_tag`:
  - Tag vazia → erro
  - Não encontrado → erro
  - `ativo == false` → erro

Tag temporária: válida até `expiracao_tag_temporaria`; limpeza automática em listagens e validações.

### Sessão IHM

Chave `localStorage`: **`ihm_sessao`**

```json
{ "operador": "Nome do Funcionário" }
```

Usada para restaurar a tela após reinício do totem (`Leitor.tsx`).

## Usuários seed (desenvolvimento)

`database.sql` insere usuários padrão (`admin`, `operador`, `master`) com senha em hash bcrypt.

**Em produção:** altere todas as senhas após o primeiro deploy. Não use credenciais padrão em ambiente exposto.

## Matriz resumida

| Ação | Admin (user) | IHM (funcionário) |
|------|--------------|-------------------|
| Autenticação | username + senha | tag RFID |
| Armazenamento | `localStorage.user` | `localStorage.ihm_sessao` |
| Header HTTP | `X-User-Id` | nenhum |
| Proteção de rota | `ProtectedRoute` | fluxo de telas IHM |

## Melhorias futuras (não implementadas)

Documentadas como evolução possível:

- JWT ou sessão com cookie httpOnly
- Middleware FastAPI validando usuário/role por rota
- API keys para integrações
- Rate limiting no login
