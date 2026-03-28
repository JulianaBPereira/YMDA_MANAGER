from pydantic import BaseModel
from typing import Optional, List
from .pecasSchema import PecaResponse


class ModeloCreate(BaseModel):
	nome: str
	produto_id: int


class ModeloUpdate(BaseModel):
	nome: Optional[str] = None
	produto_id: Optional[int] = None


class ModeloResponse(BaseModel):
	id: int
	nome: str
	produto_id: int
	pecas: List[PecaResponse] = []

	class Config:
		from_attributes = True

