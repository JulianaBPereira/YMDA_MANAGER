from typing import Optional
from sqlalchemy.orm import Session
from ..DAO.produtos_dao import ProdutoDAO
from ..Model.Produtos import Produto


class ProdutoService:
	def __init__(self, dao: ProdutoDAO):
		self.dao = dao

	def listar(self) -> list[Produto]:
		return self.dao.listar_todos()

	def buscar(self, produto_id: int) -> Optional[Produto]:
		return self.dao.buscar_por_id(produto_id)

	def criar(self, nome: str) -> Produto:
		nome = nome.strip()
		if not nome:
			raise ValueError("Nome do produto não pode ser vazio.")
		return self.dao.criar(nome)

	def atualizar_nome(self, produto_id: int, novo_nome: str) -> Produto:
		novo_nome = novo_nome.strip()
		if not novo_nome:
			raise ValueError("Nome do produto não pode ser vazio.")
		produto = self.dao.atualizar_nome(produto_id, novo_nome)
		if produto is None:
			raise ValueError(f"Produto {produto_id} não encontrado.")
		return produto

	def remover(self, produto_id: int) -> None:
		ok = self.dao.remover(produto_id)
		if not ok:
			raise ValueError(f"Produto {produto_id} não encontrado.")

