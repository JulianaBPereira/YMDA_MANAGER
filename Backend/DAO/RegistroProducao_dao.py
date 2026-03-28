from datetime import date, time
from typing import Optional
from sqlalchemy.orm import Session, joinedload
from ..Model.RegistroProdução import RegistroProducao

class RegistroProducaoDAO:

    def __init__(self, db: Session):
        self.db = db

    def criar(
        self,
        funcionario_id: int,
        operacao_id: int,
        data_inicio: Optional[date] = None,
        data_fim: Optional[date] = None,
        horario_inicio: Optional[time] = None,
        horario_fim: Optional[time] = None,
    ) -> RegistroProducao:
        registro = RegistroProducao(
            funcionario_id=funcionario_id,
            operacao_id=operacao_id,
            data_inicio=data_inicio,
            data_fim=data_fim,
            horario_inicio=horario_inicio,
            horario_fim=horario_fim,
        )
        self.db.add(registro)
        self.db.commit()
        self.db.refresh(registro)
        return registro


    def buscar_por_id(self, registro_id: int) -> Optional[RegistroProducao]:
        return (
            self.db.query(RegistroProducao)
            .options(
                joinedload(RegistroProducao.funcionario).joinedload("turnos")
            )
            .filter(RegistroProducao.id == registro_id)
            .first()
        )

    def listar_todos(self) -> list[RegistroProducao]:
        return (
            self.db.query(RegistroProducao)
            .options(
                joinedload(RegistroProducao.funcionario).joinedload("turnos")
            )
            .all()
        )


    def listar_em_aberto(self) -> list[RegistroProducao]:
        """Registros sem data_fim ou horario_fim definidos."""
        return (
            self.db.query(RegistroProducao)
            .options(
                joinedload(RegistroProducao.funcionario).joinedload("turnos")
            )
            .filter(
                (RegistroProducao.data_fim.is_(None))
                | (RegistroProducao.horario_fim.is_(None))
            )
            .all()
        )

    def finalizar(
        self,
        registro_id: int,
        data_fim: date,
        horario_fim: time,
    ) -> Optional[RegistroProducao]:
        """Encerra um registro definindo data e horário de fim."""
        return self.atualizar(
            registro_id,
            data_fim=data_fim,
            horario_fim=horario_fim,
        )


    def deletar(self, registro_id: int) -> bool:
        registro = self.buscar_por_id(registro_id)
        if not registro:
            return False
        self.db.delete(registro)
        self.db.commit()
        return True