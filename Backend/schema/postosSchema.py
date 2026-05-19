from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PostoCreate(BaseModel):
    nome: str
    sublinha_id: int
    dispositivo_id: Optional[int] = None


class PostoUpdate(BaseModel):
    nome: Optional[str] = None
    sublinha_id: Optional[int] = None
    dispositivo_id: Optional[int] = None


class PostoResponse(BaseModel):
    id: int
    nome: str
    sublinha_id: int
    dispositivo_id: Optional[int] = None
    data_criacao: Optional[datetime] = None
    data_remocao: Optional[datetime] = None

    class Config:
        from_attributes = True
