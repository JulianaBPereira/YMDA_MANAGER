from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class Funcionario(Base):
    __tablename__ = 'funcionarios'

    id = Column(Integer, primary_key=True, autoincrement=True)
    tag = Column(String, nullable=False)
    matricula = Column(String, nullable=False)
    nome = Column(String, nullable=False)
    ativo = Column(Boolean, default=True)
    tag_temporaria = Column(String, nullable=True)
    data_criacao = Column(DateTime, default=datetime.utcnow)
    data_remocao = Column(DateTime, nullable=True)

    # relacionamento com turnos (N:N)
    turnos = relationship(
        "Turnos",
        secondary="funcionario_turnos",
        back_populates="funcionarios"
    )

    registros = relationship(
        "RegistroProducao",
        back_populates="funcionario"
    )


class Turnos(Base):
    __tablename__ = 'turnos'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String(100), nullable=False)

    # relacionamento com funcionarios (N:N)
    funcionarios = relationship(
        "Funcionario",
        secondary="funcionario_turnos",
        back_populates="turnos"
    )


class FuncionarioTurnos(Base):
    __tablename__ = 'funcionario_turnos'

    funcionario_id = Column(Integer, ForeignKey('funcionarios.id'), primary_key=True)
    turno_id = Column(Integer, ForeignKey('turnos.id'), primary_key=True)