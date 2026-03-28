from datetime import date, time
from typing import Optional
from ..DAO.RegistroProducao_dao import RegistroProducaoDAO
from ..Model.RegistroProdução import RegistroProducao


class RegistroProducaoService:
	def __init__(self, dao: RegistroProducaoDAO):
		self.dao = dao

	def listar(self) -> list[RegistroProducao]:
		registros = self.dao.listar_todos()
		# Enriquecer com campo 'turno' (primeiro turno do funcionário, se houver)
		for r in registros:
			try:
				turnos = getattr(getattr(r, "funcionario", None), "turnos", []) or []
				r.turno = turnos[0].nome if len(turnos) > 0 and getattr(turnos[0], "nome", None) else None
			except Exception:
				r.turno = None
		return registros

	def listar_em_aberto(self) -> list[RegistroProducao]:
		registros = self.dao.listar_em_aberto()
		for r in registros:
			try:
				turnos = getattr(getattr(r, "funcionario", None), "turnos", []) or []
				r.turno = turnos[0].nome if len(turnos) > 0 and getattr(turnos[0], "nome", None) else None
			except Exception:
				r.turno = None
		return registros

	def buscar(self, registro_id: int) -> Optional[RegistroProducao]:
		r = self.dao.buscar_por_id(registro_id)
		if r:
			try:
				turnos = getattr(getattr(r, "funcionario", None), "turnos", []) or []
				r.turno = turnos[0].nome if len(turnos) > 0 and getattr(turnos[0], "nome", None) else None
			except Exception:
				r.turno = None
		return r

	def criar(
		self,
		funcionario_id: int,
		operacao_id: int,
		data_inicio: Optional[date] = None,
		data_fim: Optional[date] = None,
		horario_inicio: Optional[time] = None,
		horario_fim: Optional[time] = None,
	) -> RegistroProducao:
		if funcionario_id <= 0 or operacao_id <= 0:
			raise ValueError("funcionario_id e operacao_id devem ser positivos.")
		return self.dao.criar(
			funcionario_id=funcionario_id,
			operacao_id=operacao_id,
			data_inicio=data_inicio,
			data_fim=data_fim,
			horario_inicio=horario_inicio,
			horario_fim=horario_fim,
		)

	def finalizar(self, registro_id: int, data_fim: date, horario_fim: time) -> RegistroProducao:
		registro = self.dao.finalizar(registro_id, data_fim, horario_fim)
		if registro is None:
			raise ValueError("Registro não encontrado.")
		return registro

	def deletar(self, registro_id: int) -> None:
		ok = self.dao.deletar(registro_id)
		if not ok:
			raise ValueError("Registro não encontrado.")

