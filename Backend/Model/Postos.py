from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from ..Database.database import Base

class Posto(Base):
    __tablename__ = 'postos'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String(255), nullable=False)
    sublinha_id = Column(Integer, ForeignKey('sublinhas.id'), nullable=False)
    dispositivo_id = Column(Integer, ForeignKey('dispositivos_raspberry.id'), nullable=True)
    data_criacao = Column(DateTime, default=datetime.utcnow)
    data_remocao = Column(DateTime, nullable=True)