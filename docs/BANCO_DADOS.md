# Banco de dados

PostgreSQL 16. Configuração em `Backend/database/database.py` via variáveis de ambiente.

## Conexão

URL montada em runtime:

```
postgresql+psycopg2://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}
```

Arquivo `.env` esperado em `Backend/.env` (carregado por `python-dotenv`).

## Schema inicial

**Arquivo:** `Backend/database/database.sql`

Executado automaticamente no Docker pela primeira inicialização do volume Postgres:

```yaml
# docker-compose.yml
./Backend/database/database.sql:/docker-entrypoint-initdb.d/01-database.sql
```

> No repositório o caminho pode ser `Backend/database/database.sql` (minúsculas). Ajuste o volume do compose se o deploy falhar por arquivo não encontrado.

### Tabelas principais

| Tabela | Descrição |
|--------|-----------|
| `usuarios` | Login do painel admin |
| `funcionarios` | Operadores (RFID) |
| `turnos`, `funcionario_turnos` | Turnos de trabalho |
| `funcionario_operacoes` | Operações que o funcionário pode executar |
| `linhas`, `sublinhas` | Hierarquia fabril |
| `dispositivos_raspberry` | Totens |
| `postos` | Postos de trabalho |
| `produtos`, `modelos`, `pecas` | Catálogo |
| `modelo_pecas`, `operacao_pecas` | Associações N:N |
| `operacoes` | Definição do trabalho no posto |
| `registros_producao` | Apontamentos de produção |

### Seed

O SQL inclui usuários padrão (`admin`, `operador`, `master`) com `senha_hash` bcrypt. Troque as senhas em produção.

### Timezone

```sql
SET TIME ZONE 'America/Manaus';
```

## Evolução do schema (startup)

Além do `database.sql`, `Backend/app.py` executa no **startup**:

```sql
ALTER TABLE operacoes ADD COLUMN IF NOT EXISTS nome VARCHAR(255);
UPDATE operacoes SET nome = COALESCE(NULLIF(nome, ''), 'Operação sem nome');
ALTER TABLE registros_producao ADD COLUMN IF NOT EXISTS comentario TEXT;
ALTER TABLE registros_producao ADD COLUMN IF NOT EXISTS quantidade INTEGER;
```

**Schema efetivo** = `database.sql` + esses `ALTER`s.

Ao adicionar colunas novas:

1. Atualize `database.sql` para instalações limpas.
2. Adicione `ALTER TABLE ... IF NOT EXISTS` no startup **ou** adote migrações formais (Alembic).

## Soft delete vs hard delete

| Entidade | Comportamento |
|----------|----------------|
| `usuarios` | Soft: `ativo`, `data_remocao` |
| `funcionarios` | Campo `ativo`; `data_remocao` no model |
| `produtos`, `postos`, `dispositivos_raspberry` | `data_remocao` no model (uso varia por DAO) |
| `postos` (delete API) | Hard delete no DAO atual |
| `registros_producao` | Hard delete no endpoint DELETE |

Consulte o DAO específico antes de assumir soft delete.

## Registro em aberto

Consultas típicas (IHM):

```sql
WHERE data_fim IS NULL OR horario_fim IS NULL
```

Registro finalizado preenche `data_fim` e `horario_fim`.

## Relacionamentos e CASCADE

- Remover **linha** → CASCADE em sublinhas.
- Remover **sublinha** → CASCADE em postos e operações vinculadas.
- `funcionario_id` em registros: `ON DELETE SET NULL`.
- `operacao_id` em registros: `ON DELETE CASCADE`.

## Models SQLAlchemy

Import central em `Backend/Model/__init__.py` — importar `Model` no `app.py` garante que todos os mapeamentos sejam registrados.

Arquivos com acentuação no nome (ex.: `RegistroProdução.py`) — use o mesmo nome nos imports do Python.

## Backup e restore

Exemplo com Docker:

```bash
docker exec ymda_manager_postgres pg_dump -U postgres ymda_manager > backup.sql
```

Restore em ambiente novo: aplicar `database.sql` ou dump antes de subir o backend.

## Ferramenta de migração

O projeto **não usa** Alembic/Flyway hoje. Migrações são manuais (SQL + startup). Para equipes maiores, considere adotar Alembic e documentar o fluxo aqui.

## Índices e performance

O `database.sql` inicial não define índices extras além das PK/FK. Se o volume de `registros_producao` crescer, avalie índices em:

- `registros_producao(funcionario_id, operacao_id)`
- `funcionarios(matricula)`, `funcionarios(tag)`
- `postos(sublinha_id, dispositivo_id)`
