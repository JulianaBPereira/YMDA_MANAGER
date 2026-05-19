
from pydantic import BaseModel
from typing import Optional


class SublinhaCreate(BaseModel):
    nome: str
    linha_id: int


class SublinhaUpdate(BaseModel):
    nome: str
    linha_id: int


class SublinhaResponse(BaseModel):
    id: int
    nome: str
    linha_id: int
    linha_nome: Optional[str] = None

    class Config:
        from_attributes = True