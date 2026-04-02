from datetime import date, time
from typing import Optional
from ..DAO.RegistroProducao_dao import RegistroProducaoDAO
from ..Model.Funcionarios import Funcionario
from ..Model.Operacoes import Operacao
from ..Model.RegistroProdução import RegistroProducao


class RegistroProducaoService:
	def __init__(self, dao: RegistroProducaoDAO):
		self.dao = dao

	def _enriquecer(self, r: RegistroProducao) -> None:
		try:
			funcionario = getattr(r, "funcionario", None)
			turnos = getattr(funcionario, "turnos", []) or []
			r.turno = turnos[0].nome if len(turnos) > 0 and getattr(turnos[0], "nome", None) else None
		except Exception:
			r.turno = None

		operacao = getattr(r, "operacao", None)
		funcionario = getattr(r, "funcionario", None)
		r.operador = getattr(funcionario, "nome", None) if funcionario else None
		r.matricula = getattr(funcionario, "matricula", None) if funcionario else None
		r.operacao_nome = getattr(operacao, "nome", None) if operacao else None

		sublinha = getattr(operacao, "sublinha", None) if operacao else None
		linha = getattr(sublinha, "linha", None) if sublinha else None
		r.sublinha = getattr(sublinha, "nome", None) if sublinha else None
		r.linha = getattr(linha, "nome", None) if linha else None

		posto = getattr(operacao, "posto", None) if operacao else None
		produto = getattr(operacao, "produto", None) if operacao else None
		modelo = getattr(operacao, "modelo", None) if operacao else None
		dispositivo = getattr(operacao, "dispositivo", None) if operacao else None
		pecas = getattr(operacao, "pecas", []) if operacao else []

		r.posto = getattr(posto, "nome", None) if posto else None
		r.produto = getattr(produto, "nome", None) if produto else None
		r.modelo = getattr(modelo, "nome", None) if modelo else None
		r.peca = getattr(pecas[0], "nome", None) if pecas else None
		r.codigo_producao = getattr(pecas[0], "codigo", None) if pecas else None
		# Quantidade deve refletir o valor digitado pelo operador no registro.
		# Se não houver valor salvo, retorna 0 (evita "None" e evita números incorretos).
		quantidade_registrada = getattr(r, "quantidade", None)
		r.quantidade = quantidade_registrada if quantidade_registrada is not None else 0
		r.totem = getattr(dispositivo, "serial_number", None) if dispositivo else None
		r.comentario = getattr(r, "comentario", None)

	def listar(self) -> list[RegistroProducao]:
		registros = self.dao.listar_todos()
		for r in registros:
			self._enriquecer(r)
		return registros

	def listar_em_aberto(self) -> list[RegistroProducao]:
		registros = self.dao.listar_em_aberto()
		for r in registros:
			self._enriquecer(r)
		return registros

	def buscar(self, registro_id: int) -> Optional[RegistroProducao]:
		r = self.dao.buscar_por_id(registro_id)
		if r:
			self._enriquecer(r)
		return r

	def criar(
		self,
		funcionario_id: int,
		operacao_id: int,
		data_inicio: Optional[date] = None,
		data_fim: Optional[date] = None,
		horario_inicio: Optional[time] = None,
		horario_fim: Optional[time] = None,
		comentario: Optional[str] = None,
		quantidade: Optional[int] = None,
	) -> RegistroProducao:
		if funcionario_id <= 0 or operacao_id <= 0:
			raise ValueError("funcionario_id e operacao_id devem ser positivos.")

		funcionario = (
			self.dao.db.query(Funcionario)
			.filter(Funcionario.id == funcionario_id)
			.first()
		)
		if not funcionario:
			raise ValueError("Funcionário não encontrado.")
		if not funcionario.ativo:
			raise ValueError("Funcionário inativo não pode iniciar registros de produção.")

		operacao = self.dao.db.query(Operacao).filter(Operacao.id == operacao_id).first()
		if not operacao:
			raise ValueError("Operação não encontrada.")

		registro = self.dao.criar(
			funcionario_id=funcionario_id,
			operacao_id=operacao_id,
			data_inicio=data_inicio,
			data_fim=data_fim,
			horario_inicio=horario_inicio,
			horario_fim=horario_fim,
			comentario=comentario,
			quantidade=quantidade,
		)
		self._enriquecer(registro)
		return registro

	def finalizar(
		self,
		registro_id: int,
		data_fim: date,
		horario_fim: time,
		comentario: Optional[str] = None,
		quantidade: Optional[int] = None,
	) -> RegistroProducao:
		registro = self.dao.finalizar(registro_id, data_fim, horario_fim, comentario, quantidade)
		if registro is None:
			raise ValueError("Registro não encontrado.")
		self._enriquecer(registro)
		return registro

	def atualizar_comentario(self, registro_id: int, comentario: Optional[str]) -> RegistroProducao:
		comentario_normalizado = comentario.strip() if isinstance(comentario, str) else None
		registro = self.dao.atualizar(registro_id, comentario=comentario_normalizado)
		if registro is None:
			raise ValueError("Registro não encontrado.")
		self._enriquecer(registro)
		return registro

	def deletar(self, registro_id: int) -> None:
		ok = self.dao.deletar(registro_id)
		if not ok:
			raise ValueError("Registro não encontrado.")

