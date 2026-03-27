from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from ..database import Base


class Linha(Base):
    __tablename__ = 'linhas'

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(255), nullable=False)

    # uma linha tem várias sublinhas
    sublinhas = relationship(
        "Sublinha", 
        back_populates="linha"
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