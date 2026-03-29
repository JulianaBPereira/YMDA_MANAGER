from sqlalchemy import Column, Integer, Date, Time, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from datetime import datetime
from ..Database.database import Base


class Operacao(Base):
    __tablename__ = 'operacoes'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String(255), nullable=False)

    sublinha_id = Column(Integer, ForeignKey('sublinhas.id'))
    posto_id = Column(Integer, ForeignKey('postos.id'))
    produto_id = Column(Integer, ForeignKey('produtos.id'))
    modelo_id = Column(Integer, ForeignKey('modelos.id'))
    dispositivo_id = Column(Integer, ForeignKey('dispositivos_raspberry.id'))

    data_inicio = Column(Date)
    data_fim = Column(Date)
    horario_inicio = Column(Time)
    horario_fim = Column(Time)
    data_criacao = Column(DateTime, default=datetime.utcnow)

    sublinha = relationship("Sublinha", back_populates="operacoes")
    posto = relationship("Posto")
    produto = relationship("Produto")
    modelo = relationship("Modelo")
    dispositivo = relationship("DispositivoRaspberry")

    pecas = relationship(
        "Peca",
        secondary="operacao_pecas",
        back_populates="operacoes"
    )

    registros = relationship(
        "RegistroProducao", 
        back_populates="operacao"
    )


class OperacaoPecas(Base):
    __tablename__ = 'operacao_pecas'

    operacao_id = Column(Integer, ForeignKey('operacoes.id'), primary_key=True)
    peca_id = Column(Integer, ForeignKey('pecas.id'), primary_key=True)