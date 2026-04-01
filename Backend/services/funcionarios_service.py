from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from ..DAO.funcionarios_dao import FuncionariosDAO
from ..Schema.funcionariosSchema import FuncionarioCreate, FuncionarioUpdate

# Duração padrão de uma tag temporária
DURACAO_TAG_TEMPORARIA_HORAS = 10


class FuncionarioService:
    def __init__(self, db: Session):
        self.dao = FuncionariosDAO(db)

    def cadastrar(self, dados: FuncionarioCreate):
        if not dados.turno_ids:
            raise ValueError("Funcionário deve ter pelo menos um turno.")
        if not dados.tag or not dados.matricula:
            raise ValueError("Tag e matrícula são obrigatórios.")

        return self.dao.criar_funcionario(
            tag=dados.tag,
            matricula=dados.matricula,
            nome=dados.nome,
            tag_temporaria=dados.tag_temporaria,
            ativo=dados.ativo,
            turno_ids=dados.turno_ids,
            operacao_ids=dados.operacao_ids,
        )

    def atualizar(self, funcionario_id: int, dados: FuncionarioUpdate):
        funcionario = self.dao.buscar_por_id(funcionario_id)
        if not funcionario:
            raise ValueError("Funcionário não encontrado.")
        if not dados.turno_ids:
            raise ValueError("Funcionário deve ter pelo menos um turno.")

        return self.dao.atualizar_funcionario(
            funcionario_id=funcionario_id,
            tag=dados.tag,
            matricula=dados.matricula,
            nome=dados.nome,
            tag_temporaria=dados.tag_temporaria,
            ativo=dados.ativo,
            turno_ids=dados.turno_ids,
            operacao_ids=dados.operacao_ids,
        )

    def deletar(self, funcionario_id: int):
        funcionario = self.dao.buscar_por_id(funcionario_id)
        if not funcionario:
            raise ValueError("Funcionário não encontrado.")
        self.dao.deletar_funcionario(funcionario_id)

    def listar(self):
        # Aproveita a listagem para limpar tags vencidas em segundo plano
        self.dao.limpar_tags_expiradas()
        return self.dao.listar()

    def buscar_por_id(self, funcionario_id: int):
        funcionario = self.dao.buscar_por_id(funcionario_id)
        if not funcionario:
            raise ValueError("Funcionário não encontrado.")
        return funcionario

    def buscar_por_tag(self, tag: str):
        if not tag or not tag.strip():
            raise ValueError("Tag inválida.")

        self.dao.limpar_tags_expiradas()
        funcionario = self.dao.buscar_por_tag(tag.strip())
        if not funcionario:
            raise ValueError("Funcionário não encontrado para a tag informada.")
        if not funcionario.ativo:
            raise ValueError("Funcionário inativo.")
        return funcionario

    # ──────────────────────────────────────────────
    # Tag temporária — regras de negócio
    # ──────────────────────────────────────────────

    def adicionar_tag_temporaria(self, funcionario_id: int, tag_temporaria: str):
        # Limpa tags vencidas antes de verificar conflitos
        self.dao.limpar_tags_expiradas()

        # Verifica se a tag já está em uso por outro funcionário (fixa ou temporária)
        dono_atual = self.dao.buscar_por_tag(tag_temporaria)
        if dono_atual and dono_atual.id != funcionario_id:
            raise ValueError(
                f"A tag '{tag_temporaria}' já está em uso pelo funcionário '{dono_atual.nome}'."
            )

        # Define a expiração: agora + 10 horas
        expiracao = datetime.utcnow() + timedelta(hours=DURACAO_TAG_TEMPORARIA_HORAS)

        return self.dao.definir_tag_temporaria(funcionario_id, tag_temporaria, expiracao)

    def remover_tag_temporaria(self, funcionario_id: int):
        funcionario = self.dao.buscar_por_id(funcionario_id)
        if not funcionario:
            raise ValueError("Funcionário não encontrado.")

        if not funcionario.tag_temporaria:
            raise ValueError("Este funcionário não possui tag temporária ativa.")

        return self.dao.remover_tag_temporaria(funcionario_id)

    def limpar_tags_expiradas(self) -> int:
        return self.dao.limpar_tags_expiradas()
