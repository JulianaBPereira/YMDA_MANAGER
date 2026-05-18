# Regras de negócio

Regras implementadas na camada **Service** e **DAO**. Erros de negócio viram `ValueError` → HTTP 400, salvo onde indicado.

## Postos

**Arquivos:** `postos_service.py`, `postos_dao.py`

| Regra | Detalhe |
|-------|---------|
| Unicidade | Não pode existir outro posto com a mesma combinação **`sublinha_id` + `dispositivo_id`** (o nome pode repetir) |
| Criação | `criar_posto` valida duplicidade antes de inserir |
| Atualização | Usa valores finais (mesclando campos enviados com os atuais) para checar duplicidade excluindo o próprio ID |
| Exclusão | Hard delete no DAO (`db.delete`) |

Mensagem de erro: *"Já existe um posto para esta sublinha e dispositivo."*

## Funcionários

**Arquivos:** `funcionarios_service.py`, `funcionarios_dao.py`

| Regra | Detalhe |
|-------|---------|
| Turnos | Obrigatório pelo menos um `turno_id` no cadastro/atualização |
| Tag e matrícula | Obrigatórios no cadastro |
| RFID / tag | `buscar_por_tag` exige funcionário **ativo** |
| Tag temporária | Duração padrão: **10 horas** (`DURACAO_TAG_TEMPORARIA_HORAS`) |
| Conflito de tag | Tag temporária não pode estar em uso por outro funcionário (fixa ou temporária) |
| Limpeza | `limpar_tags_expiradas` roda ao listar e ao validar tag |

## Registros de produção

**Arquivos:** `registros_producao_service.py`, `ihm_controller.py`

| Regra | Detalhe |
|-------|---------|
| Criação | `funcionario_id` e `operacao_id` > 0; funcionário deve existir e estar **ativo** |
| Em aberto | Consultas IHM: `data_fim` ou `horario_fim` nulos |
| Quantidade | Na resposta enriquecida: usa valor salvo; se `null`, retorna **0** (não inventa quantidade) |
| Enriquecimento | Preenche turno, operador, matrícula, linha, sublinha, posto, produto, modelo, peça, totem (serial), comentário |
| Finalização | Preenche data/hora fim, quantidade e comentário opcionais |
| Dashboard WS | Após entrada/saída na IHM, dispara `dashboard_refresh` no WebSocket |

## Operações (IHM)

**Arquivo:** `ihm_controller.py` — `registrar_entrada`

Ordem para escolher a operação:

1. ID em `body.operacao`
2. Nome do posto em `body.posto` (primeira operação daquele posto)
3. Primeira operação do banco (fallback)

Se nenhuma operação existir → HTTP 400 *"Nenhuma operação cadastrada para iniciar"*.

## Dispositivos Raspberry

**Arquivos:** `dispositivos_service.py`, `app.py` startup

| Regra | Detalhe |
|-------|---------|
| Serial | Lido de `/proc/cpuinfo` no Linux; ignora `0000000000000000` |
| Auto-registro | No startup, `ensure_local_registered()` cria dispositivo "Raspberry Local" se o serial ainda não existir |
| Criação manual | `serial_number` obrigatório (ou obtido do hardware) |
| Variável de ambiente | Fallback de serial pode existir além do cpuinfo (ver final do service) |

## Usuários

**Arquivo:** `usuarios_service.py`

| Regra | Detalhe |
|-------|---------|
| Login | Usuário deve estar `ativo` |
| Senha | Hash bcrypt na criação/atualização |
| Exclusão | Soft delete (`ativo = false`, `data_remocao`) |

## Linhas e sublinhas

Regras específicas de exclusão e vínculo estão nos services `linhas_service.py` — ao remover linha/sublinha, o CASCADE do banco afeta postos e operações dependentes (ver `database.sql`).

## Produtos e modelos

Produtos suportam `data_remocao` (soft delete no model). Modelos e peças têm endpoints de associação N:N (`modelo_pecas`, `operacao_pecas`).

## Dashboard (grid de postos)

**Arquivo:** `registros_producao_controller.py`

- Monta grade por sublinha × posto.
- Slot **ativo** quando há registro em aberto naquele posto.
- Status: `em_operacao` ou `livre`.

## Onde NÃO há regra (cuidado)

- Endpoints admin sem checagem de `X-User-Id` no backend.
- IHM acessível sem token se a rede permitir.
- CORS aberto (`*`).

Documente deploy em rede fechada ou implemente auth server-side antes de expor externamente.

## Referência rápida por arquivo

| Domínio | Service |
|---------|---------|
| Postos | `postos_service.py` |
| Funcionários | `funcionarios_service.py` |
| Registros | `registros_producao_service.py` |
| Usuários | `usuarios_service.py` |
| Dispositivos | `dispositivos_service.py` |
| Linhas | `linhas_service.py` |
| Operações | `operacoes_service.py` |
