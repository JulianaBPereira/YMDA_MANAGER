from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from ..Database.database import Base


class Linha(Base):
    __tablename__ = 'linhas'

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(255), nullable=False)
    data_criacao = Column(DateTime, default=datetime.utcnow)

    # uma linha tem várias sublinhas
    sublinhas = relationship(
        "Sublinha", 
        back_populates="linha",
        cascade="all, delete-orphan"
        )


class Sublinha(Base):
    __tablename__ = 'sublinhas'

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(255), nullable=False)
    linha_id = Column(Integer, ForeignKey('linhas.id'))

    # sublinha pertence a uma linha
    linha = relationship(
        "Linha", 
        back_populates="sublinhas"
        )

    # sublinha possui várias operações (lado inverso em Operacao.sublinha)
    operacoes = relationship(
        "Operacao",
        back_populates="sublinha"
        )