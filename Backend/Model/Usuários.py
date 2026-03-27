from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from ..database import Base

class Usuario(Base):
    __tablename__ = 'usuarios'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), nullable=False)
    senha_hash = Column(String(255), nullable=False)
    nome = Column(String(255), nullable=False)
    role = Column(String(50), default='admin')
    ativo = Column(Boolean, default=True)
    data_criacao = Column(DateTime, default=datetime.utcnow)
    data_remocao = Column(DateTime, nullable=True)