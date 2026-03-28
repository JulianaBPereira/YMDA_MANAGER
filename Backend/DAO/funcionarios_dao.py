from sqlalchemy.orm import Session
from datetime import datetime
from ..Model.Funcionarios import Funcionario, Turnos, FuncionarioTurnos


class FuncionariosDAO:
    def __init__(self, db: Session):
        self.db = db

    def criar_funcionario(self, tag: str, matricula: str, nome: str,
                          tag_temporaria: str, ativo: bool, turno_ids: list[int]):
        novo = Funcionario(
            tag=tag,
            matricula=matricula,
            nome=nome,
            tag_temporaria=tag_temporaria,
            ativo=ativo,
            data_criacao=datetime.utcnow()
        )
        turnos = self.db.query(Turnos).filter(Turnos.id.in_(turno_ids)).all()
        novo.turnos = turnos
        self.db.add(novo)
        self.db.commit()
        self.db.refresh(novo)
        return novo

    def atualizar_funcionario(self, funcionario_id: int, tag: str, matricula: str,
                               nome: str, tag_temporaria: str, ativo: bool, turno_ids: list[int]):
        funcionario = self.db.query(Funcionario).filter(Funcionario.id == funcionario_id).first()
        if not funcionario:
            return None

        funcionario.tag = tag
        funcionario.matricula = matricula
        funcionario.nome = nome
        funcionario.tag_temporaria = tag_temporaria
        funcionario.ativo = ativo

        turnos = self.db.query(Turnos).filter(Turnos.id.in_(turno_ids)).all()
        funcionario.turnos = turnos

        self.db.commit()
        self.db.refresh(funcionario)
        return funcionario

    def deletar_funcionario(self, funcionario_id: int) -> None:
        funcionario = self.db.query(Funcionario).filter(Funcionario.id == funcionario_id).first()
        if funcionario:
            self.db.delete(funcionario)
            self.db.commit()

    def buscar_por_id(self, funcionario_id: int):
        return self.db.query(Funcionario).filter(Funcionario.id == funcionario_id).first()

    def listar(self):
        return self.db.query(Funcionario).all()


    def definir_tag_temporaria(self, funcionario_id: int, tag: str, expiracao: datetime):
        """Salva a tag temporária e quando ela vai expirar."""
        funcionario = self.db.query(Funcionario).filter(Funcionario.id == funcionario_id).first()
        if not funcionario:
            return None

        funcionario.tag_temporaria = tag
        funcionario.expiracao_tag_temporaria = expiracao
        self.db.commit()
        self.db.refresh(funcionario)
        return funcionario

    def remover_tag_temporaria(self, funcionario_id: int):
        """Remove a tag temporária do funcionário."""
        funcionario = self.db.query(Funcionario).filter(Funcionario.id == funcionario_id).first()
        if not funcionario:
            return None

        funcionario.tag_temporaria = None
        funcionario.expiracao_tag_temporaria = None
        self.db.commit()
        self.db.refresh(funcionario)
        return funcionario

    def limpar_tags_expiradas(self) -> int:
        """Remove automaticamente as tags temporárias que já venceram (após 10h)."""
        agora = datetime.utcnow()
        expirados = (
            self.db.query(Funcionario)
            .filter(
                Funcionario.expiracao_tag_temporaria != None,
                Funcionario.expiracao_tag_temporaria < agora
            )
            .all()
        )

        for funcionario in expirados:
            funcionario.tag_temporaria = None
            funcionario.expiracao_tag_temporaria = None

        self.db.commit()
        return len(expirados)
