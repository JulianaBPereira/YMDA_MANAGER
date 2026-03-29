from datetime import datetime
from pydantic import BaseModel


class PecaCreate(BaseModel):
	nome: str
	codigo: str


class PecaUpdate(BaseModel):
	nome: str | None = None
	codigo: str | None = None


class PecaResponse(BaseModel):
	id: int
	nome: str
	codigo: str
	data_criacao: datetime | None = None
	modelo_id: int | None = None
	modelo_nome: str | None = None
	produto_id: int | None = None
	produto_nome: str | None = None

	class Config:
		from_attributes = True

