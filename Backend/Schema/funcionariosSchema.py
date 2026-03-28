from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class TurnoSchema(BaseModel):
    id: int
    nome: str

    class Config:
        from_attributes = True


class FuncionarioCreate(BaseModel):
    tag: str
    matricula: str
    nome: str
    tag_temporaria: Optional[str] = None
    ativo: bool = True
    turno_ids: list[int]


class FuncionarioUpdate(BaseModel):
    tag: str
    matricula: str
    nome: str
    tag_temporaria: Optional[str] = None
    ativo: bool
    turno_ids: list[int]


class TagTemporariaSet(BaseModel):
    tag_temporaria: str  # o código da tag RFID temporária


class FuncionarioResponse(BaseModel):
    id: int
    tag: str
    matricula: str
    nome: str
    ativo: bool
    tag_temporaria: Optional[str]
    expiracao_tag_temporaria: Optional[datetime]  # quando a tag temporária expira
    data_criacao: datetime
    turnos: list[TurnoSchema]

    class Config:
        from_attributes = True
