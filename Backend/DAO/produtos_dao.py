from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from ..Model.Produtos import Produto


class ProdutoDAO:

    def __init__(self, db: Session):
        self.db = db

    def criar(self, nome: str) -> Produto:
        produto = Produto(nome=nome)
        self.db.add(produto)
        self.db.commit()
        self.db.refresh(produto)
        return produto

    def buscar_por_id(self, produto_id: int) -> Optional[Produto]:
        return (
            self.db.query(Produto)
            .filter(Produto.id == produto_id, Produto.data_remocao.is_(None))
            .first()
        )

    def listar_todos(self) -> list[Produto]:
        return (
            self.db.query(Produto)
            .filter(Produto.data_remocao.is_(None))
            .all()
        )


    def atualizar_nome(self, produto_id: int, novo_nome: str) -> Optional[Produto]:
        produto = self.buscar_por_id(produto_id)
        if not produto:
            return None
        produto.nome = novo_nome
        self.db.commit()
        self.db.refresh(produto)
        return produto


    def remover(self, produto_id: int) -> bool:
        produto = self.buscar_por_id(produto_id)
        if not produto:
            return False
        produto.data_remocao = datetime.utcnow()
        self.db.commit()
        return True
