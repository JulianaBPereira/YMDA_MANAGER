from typing import Optional
from ..DAO.pecas_dao import PecaDAO
from ..Model.Produtos import Peca


class PecaService:
	def __init__(self, dao: PecaDAO):
	 self.dao = dao

	def listar(self) -> list[Peca]:
		return self.dao.listar_todos()

	def buscar(self, peca_id: int) -> Optional[Peca]:
		return self.dao.buscar_por_id(peca_id)

	def criar(self, nome: str, codigo: str) -> Peca:
		nome = nome.strip()
		codigo = codigo.strip()
		if not nome:
			raise ValueError("Nome da peça não pode ser vazio.")
		if not codigo:
			raise ValueError("Código da peça não pode ser vazio.")
		if self.dao.existe_por_codigo(codigo):
			raise ValueError("Já existe uma peça cadastrada com esse código.")
		return self.dao.criar(nome, codigo)

	def atualizar(self, peca_id: int, novo_nome: Optional[str] = None, novo_codigo: Optional[str] = None) -> Peca:
		peca_atual = self.dao.buscar_por_id(peca_id)
		if not peca_atual:
			raise ValueError(f"Peça {peca_id} não encontrada.")

		if novo_nome is not None:
			novo_nome = novo_nome.strip()
			if not novo_nome:
				raise ValueError("Nome da peça não pode ser vazio.")
		if novo_codigo is not None:
			novo_codigo = novo_codigo.strip()
			if not novo_codigo:
				raise ValueError("Código da peça não pode ser vazio.")

		codigo_final = novo_codigo if novo_codigo is not None else peca_atual.codigo
		if self.dao.existe_por_codigo_excluindo_id(peca_id, codigo_final):
			raise ValueError("Já existe uma peça cadastrada com esse código.")

		peca = self.dao.atualizar(peca_id, novo_nome, novo_codigo)
		if peca is None:
			raise ValueError(f"Peça {peca_id} não encontrada.")
		return peca

	def deletar(self, peca_id: int) -> None:
		ok = self.dao.deletar(peca_id)
		if not ok:
			raise ValueError(f"Peça {peca_id} não encontrada.")

