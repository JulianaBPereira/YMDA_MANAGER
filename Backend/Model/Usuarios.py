# Model
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from ..Database.database import Base

class RoleEnum(PyEnum):
    admin    = 'admin'
    master   = 'master'
    operador = 'operador'

class Usuario(Base):
    __tablename__ = 'usuarios'

    id           = Column(Integer, primary_key=True, index=True)
    username     = Column(String(255), nullable=False)
    senha_hash   = Column(String(255), nullable=False)
    nome         = Column(String(255), nullable=False)
    role         = Column(Enum(RoleEnum), nullable=False)
    ativo        = Column(Boolean, default=True)
    data_criacao = Column(DateTime, default=datetime.utcnow)
    data_remocao = Column(DateTime, nullable=True)