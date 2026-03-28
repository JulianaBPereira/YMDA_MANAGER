from datetime import date, time
from pydantic import BaseModel
from typing import Optional


class RegistroCreate(BaseModel):
	funcionario_id: int
	operacao_id: int
	data_inicio: Optional[date] = None
	data_fim: Optional[date] = None
	horario_inicio: Optional[time] = None
	horario_fim: Optional[time] = None


class RegistroUpdate(BaseModel):
	data_inicio: Optional[date] = None
	data_fim: Optional[date] = None
	horario_inicio: Optional[time] = None
	horario_fim: Optional[time] = None


class RegistroFinalizar(BaseModel):
	data_fim: date
	horario_fim: time


class RegistroResponse(BaseModel):
	id: int
	funcionario_id: int
	operacao_id: int
	data_inicio: Optional[date] = None
	data_fim: Optional[date] = None
	horario_inicio: Optional[time] = None
	horario_fim: Optional[time] = None

	class Config:
		from_attributes = True

