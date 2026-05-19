from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class DispositivoCreate(BaseModel):
    serial_number: str
    nome: str
    data_criacao: datetime = Field(default_factory=datetime.utcnow)

class DispositivoUpdate(BaseModel):
    serial_number: str
    nome: str
    data_remocao: Optional[datetime] = None

class DispositivoResponse(BaseModel):
    id: int
    serial_number: str
    nome: str
    data_criacao: datetime
    data_remocao: Optional[datetime] = None

    class Config:
        from_attributes = True