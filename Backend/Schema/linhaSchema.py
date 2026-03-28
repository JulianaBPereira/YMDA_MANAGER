# Schema/LinhaSchema.py
from pydantic import BaseModel
from datetime import datetime
from .sublinhaSchema import SublinhaResponse


class LinhaCreate(BaseModel):
    nome: str


class LinhaUpdate(BaseModel):
    nome: str


class LinhaComSublinhaCreate(BaseModel):
    nome_linha: str
    nome_sublinha: str


class LinhaResponse(BaseModel):
    id: int
    nome: str
    sublinhas: list[SublinhaResponse] = []
    data_criacao: datetime

    class Config:
        from_attributes = True