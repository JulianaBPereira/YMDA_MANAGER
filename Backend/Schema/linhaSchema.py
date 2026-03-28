# Schema/LinhaSchema.py
from pydantic import BaseModel
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

    class Config:
        from_attributes = True