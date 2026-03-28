from sqlalchemy import Column, Integer, Date, Time, ForeignKey
from sqlalchemy.orm import relationship
from ..Database.database import Base


class RegistroProducao(Base):
    __tablename__ = 'registros_producao'

    id = Column(Integer, primary_key=True, autoincrement=True)

    funcionario_id = Column(Integer, ForeignKey('funcionarios.id'), nullable=False)
    operacao_id = Column(Integer, ForeignKey('operacoes.id'), nullable=False)

    data_inicio = Column(Date)
    data_fim = Column(Date)
    horario_inicio = Column(Time)
    horario_fim = Column(Time)

    funcionario = relationship(
        "Funcionario", 
        back_populates="registros"
    )
    operacao = relationship(
        "Operacao", 
        back_populates="registros"
    )

