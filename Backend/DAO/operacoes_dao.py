from sqlalchemy.orm import Session, selectinload
from ..Model.Operacoes import Operacao, OperacaoPecas
from ..Model.Produtos import Peca
from datetime import date, time


class OperacaoDAO:
    def __init__(self, db: Session):
        self.db = db

    def criar(
        self,
        nome: str,
        sublinha_id: int,
        posto_id: int,
        produto_id: int,
        modelo_id: int,
        dispositivo_id: int | None,
        data_inicio: date | None,
        horario_inicio: time | None,
        data_fim: date = None,
        horario_fim: time = None,
    ) -> Operacao:
        nova = Operacao(
            nome=nome,
            sublinha_id=sublinha_id,
            posto_id=posto_id,
            produto_id=produto_id,
            modelo_id=modelo_id,
            dispositivo_id=dispositivo_id,
            data_inicio=data_inicio,
            horario_inicio=horario_inicio,
            data_fim=data_fim,
            horario_fim=horario_fim,
        )
        self.db.add(nova)
        self.db.commit()
        self.db.refresh(nova)
        return nova

    def buscar_por_id(self, operacao_id: int) -> Operacao | None:
        return (
            self.db.query(Operacao)
            .options(selectinload(Operacao.pecas))
            .filter(Operacao.id == operacao_id)
            .first()
        )

    def listar(self) -> list[Operacao]:
        return (
            self.db.query(Operacao)
            .options(selectinload(Operacao.pecas))
            .all()
        )

    def atualizar(
        self,
        operacao: Operacao,
        nome: str = None,
        sublinha_id: int = None,
        posto_id: int = None,
        produto_id: int = None,
        modelo_id: int = None,
        dispositivo_id: int | None = None,
        data_inicio: date = None,
        data_fim: date = None,
        horario_inicio: time = None,
        horario_fim: time = None,
    ) -> Operacao:
        if nome is not None:
            operacao.nome = nome
        if sublinha_id is not None:
            operacao.sublinha_id = sublinha_id
        if posto_id is not None:
            operacao.posto_id = posto_id
        if produto_id is not None:
            operacao.produto_id = produto_id
        if modelo_id is not None:
            operacao.modelo_id = modelo_id
        if dispositivo_id is not None:
            operacao.dispositivo_id = dispositivo_id
        if data_inicio is not None:
            operacao.data_inicio = data_inicio
        if data_fim is not None:
            operacao.data_fim = data_fim
        if horario_inicio is not None:
            operacao.horario_inicio = horario_inicio
        if horario_fim is not None:
            operacao.horario_fim = horario_fim

        self.db.commit()
        self.db.refresh(operacao)
        return operacao

    def deletar(self, operacao: Operacao) -> None:
        self.db.delete(operacao)
        self.db.commit()

    def adicionar_peca(self, operacao_id: int, peca_id: int) -> OperacaoPecas:
        associacao = OperacaoPecas(operacao_id=operacao_id, peca_id=peca_id)
        self.db.add(associacao)
        self.db.commit()
        return associacao

    def remover_peca(self, operacao_id: int, peca_id: int) -> None:
        self.db.query(OperacaoPecas).filter(
            OperacaoPecas.operacao_id == operacao_id,
            OperacaoPecas.peca_id == peca_id,
        ).delete()
        self.db.commit()

    def listar_pecas(self, operacao_id: int) -> list[Peca]:
        operacao = self.buscar_por_id(operacao_id)
        return operacao.pecas if operacao else []