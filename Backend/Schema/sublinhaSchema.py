
from pydantic import BaseModel


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

    class Config:
        from_attributes = True