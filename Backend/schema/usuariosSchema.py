from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class UsuarioCreate(BaseModel):
    username: str
    senha_hash: str
    nome: str
    role: str
    ativo: bool = True
    data_criacao: datetime = datetime

class UsuarioUpdate(BaseModel):
    username: str
    senha_hash: str
    nome: str
    role: str
    ativo: bool
    
class UsuarioResponse(BaseModel):
    id: int
    username: str
    nome: str
    role: str
    ativo: bool
    data_criacao: datetime

    class Config:
        from_attributes = True