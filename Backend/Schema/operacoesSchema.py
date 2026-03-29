from datetime import date, time, datetime
from pydantic import BaseModel
from typing import Optional
from .pecasSchema import PecaResponse


class OperacaoCreate(BaseModel):
    nome: str
    sublinha_id: int
    posto_id: int
    produto_id: int
    modelo_id: int
    dispositivo_id: Optional[int] = None
    data_inicio: Optional[date] = None
    horario_inicio: Optional[time] = None
    data_fim: Optional[date] = None
    horario_fim: Optional[time] = None


class OperacaoUpdate(BaseModel):
    nome: Optional[str] = None
    sublinha_id: Optional[int] = None
    posto_id: Optional[int] = None
    produto_id: Optional[int] = None
    modelo_id: Optional[int] = None
    dispositivo_id: Optional[int] = None
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None
    horario_inicio: Optional[time] = None
    horario_fim: Optional[time] = None


class OperacaoResponse(BaseModel):
    id: int
    nome: str
    sublinha_id: int
    posto_id: int
    produto_id: int
    modelo_id: int
    dispositivo_id: Optional[int] = None
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None
    horario_inicio: Optional[time] = None
    horario_fim: Optional[time] = None
    data_criacao: Optional[datetime] = None
    pecas: list[PecaResponse] = []

    class Config:
        from_attributes = True