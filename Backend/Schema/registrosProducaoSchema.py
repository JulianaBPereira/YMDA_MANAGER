from datetime import date, time
from pydantic import BaseModel, Field, AliasChoices
from typing import Optional


class RegistroCreate(BaseModel):
	funcionario_id: int
	operacao_id: int
	data_inicio: Optional[date] = None
	data_fim: Optional[date] = None
	horario_inicio: Optional[time] = None
	horario_fim: Optional[time] = None
	comentario: Optional[str] = None
	quantidade: Optional[int] = None


class RegistroUpdate(BaseModel):
	data_inicio: Optional[date] = None
	data_fim: Optional[date] = None
	horario_inicio: Optional[time] = None
	horario_fim: Optional[time] = None
	comentario: Optional[str] = None
	quantidade: Optional[int] = None


class RegistroFinalizar(BaseModel):
	data_fim: date
	horario_fim: time
	comentario: Optional[str] = None
	quantidade: Optional[int] = None


class RegistroComentarioUpdate(BaseModel):
	comentario: Optional[str] = None


class RegistroResponse(BaseModel):
	id: int
	funcionario_id: Optional[int] = None
	operacao_id: Optional[int] = None
	data_inicio: Optional[date] = None
	data_fim: Optional[date] = None
	horario_inicio: Optional[time] = None
	horario_fim: Optional[time] = None
	turno: Optional[str] = None
	operador: Optional[str] = None
	matricula: Optional[str] = None
	linha: Optional[str] = None
	sublinha: Optional[str] = None
	posto: Optional[str] = None
	operacao: Optional[str] = Field(default=None, validation_alias=AliasChoices("operacao_nome", "operacao"))
	produto: Optional[str] = None
	modelo: Optional[str] = None
	peca: Optional[str] = None
	codigo_producao: Optional[str] = None
	quantidade: Optional[int] = None
	totem: Optional[str] = None
	comentario: Optional[str] = None

	class Config:
		from_attributes = True

