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

	class Config:
		from_attributes = True

