from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime    
from ..database import Base

class DispositivoRaspberry(Base):
    __tablename__ = 'dispositivos_raspberry'

    id = Column(Integer, primary_key=True, autoincrement=True)
    serial_number = Column(String, nullable=False)
    nome = Column(String, nullable=False)
    data_criacao = Column(DateTime, default=datetime)
    data_remocao = Column(DateTime, nullable=True)