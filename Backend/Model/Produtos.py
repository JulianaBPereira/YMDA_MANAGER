from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..Database.database import Base


class Produto(Base):
    __tablename__ = 'produtos'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String, nullable=False)
    data_criacao = Column(DateTime, default=datetime.utcnow)
    data_remocao = Column(DateTime, nullable=True)

    # um produto tem vários modelos
    modelos = relationship("Modelo", back_populates="produto")


class Modelo(Base):
    __tablename__ = 'modelos'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String, nullable=False)
    produto_id = Column(Integer, ForeignKey('produtos.id'))

    # modelo pertence a um produto
    produto = relationship("Produto", back_populates="modelos")

    # modelo tem várias peças (N:N)
    pecas = relationship(
        "Peca",
        secondary="modelo_pecas",
        back_populates="modelos"
    )


class Peca(Base):
    __tablename__ = 'pecas'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String, nullable=False)
    codigo = Column(String, nullable=False)

    # peça pode estar em vários modelos (N:N)
    modelos = relationship(
        "Modelo",
        secondary="modelo_pecas",
        back_populates="pecas"
    )

    # peça pode estar em várias operações (N:N via operacao_pecas)
    operacoes = relationship(
        "Operacao",
        secondary="operacao_pecas",
        back_populates="pecas"
    )


class ModeloPecas(Base):
    __tablename__ = 'modelo_pecas'

    modelo_id = Column(Integer, ForeignKey('modelos.id'), primary_key=True)
    peca_id = Column(Integer, ForeignKey('pecas.id'), primary_key=True)