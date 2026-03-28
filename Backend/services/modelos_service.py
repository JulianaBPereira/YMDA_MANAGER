from typing import Optional
from ..DAO.modelos_dao import ModeloDAO
from ..Model.Produtos import Modelo, Peca


class ModeloService:
	def __init__(self, dao: ModeloDAO):
		self.dao = dao

	def listar(self) -> list[Modelo]:
		return self.dao.listar_todos()

	def listar_por_produto(self, produto_id: int) -> list[Modelo]:
		return self.dao.listar_por_produto(produto_id)

	def buscar(self, modelo_id: int) -> Optional[Modelo]:
		return self.dao.buscar_por_id(modelo_id)

	def criar(self, nome: str, produto_id: int) -> Modelo:
		nome = nome.strip()
		if not nome:
			raise ValueError("Nome do modelo não pode ser vazio.")
		if produto_id <= 0:
			raise ValueError("produto_id inválido.")
		return self.dao.criar(nome, produto_id)

	def atualizar(self, modelo_id: int, novo_nome: Optional[str] = None, novo_produto_id: Optional[int] = None) -> Modelo:
		if novo_nome is not None:
			novo_nome = novo_nome.strip()
			if not novo_nome:
				raise ValueError("Nome do modelo não pode ser vazio.")
		if novo_produto_id is not None and novo_produto_id <= 0:
			raise ValueError("produto_id inválido.")
		modelo = self.dao.atualizar(modelo_id, novo_nome, novo_produto_id)
		if modelo is None:
			raise ValueError(f"Modelo {modelo_id} não encontrado.")
		return modelo

	def deletar(self, modelo_id: int) -> None:
		ok = self.dao.deletar(modelo_id)
		if not ok:
			raise ValueError(f"Modelo {modelo_id} não encontrado.")

	def adicionar_peca(self, modelo_id: int, peca_id: int) -> Modelo:
		modelo = self.dao.adicionar_peca(modelo_id, peca_id)
		if modelo is None:
			raise ValueError("Modelo ou peça não encontrada.")
		return modelo

	def remover_peca(self, modelo_id: int, peca_id: int) -> Modelo:
		modelo = self.dao.remover_peca(modelo_id, peca_id)
		if modelo is None:
			raise ValueError("Modelo não encontrado.")
		return modelo

	def listar_pecas(self, modelo_id: int) -> list[Peca]:
		return self.dao.listar_pecas(modelo_id)

