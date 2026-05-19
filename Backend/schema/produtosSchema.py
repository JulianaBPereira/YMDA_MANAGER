from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class ProdutoCreate(BaseModel):
	nome: str


class ProdutoUpdate(BaseModel):
	nome: str


class ProdutoResponse(BaseModel):
	id: int
	nome: str
	data_criacao: datetime
	data_remocao: Optional[datetime] = None

	class Config:
		from_attributes = True

