from typing import Optional
from sqlalchemy.orm import Session
from ..Model.Produtos import Modelo, Peca


class ModeloDAO:

    def __init__(self, db: Session):
        self.db = db

    def criar(self, nome: str, produto_id: int) -> Modelo:
        modelo = Modelo(nome=nome, produto_id=produto_id)
        self.db.add(modelo)
        self.db.commit()
        self.db.refresh(modelo)
        return modelo

    def buscar_por_id(self, modelo_id: int) -> Optional[Modelo]:
        return self.db.query(Modelo).filter(Modelo.id == modelo_id).first()

    def listar_todos(self) -> list[Modelo]:
        return self.db.query(Modelo).all()

    def listar_por_produto(self, produto_id: int) -> list[Modelo]:
        return (
            self.db.query(Modelo)
            .filter(Modelo.produto_id == produto_id)
            .all()
        )

    def atualizar(
        self,
        modelo_id: int,
        novo_nome: Optional[str] = None,
        novo_produto_id: Optional[int] = None,
    ) -> Optional[Modelo]:
        modelo = self.buscar_por_id(modelo_id)
        if not modelo:
            return None
        if novo_nome is not None:
            modelo.nome = novo_nome
        if novo_produto_id is not None:
            modelo.produto_id = novo_produto_id
        self.db.commit()
        self.db.refresh(modelo)
        return modelo

    def adicionar_peca(self, modelo_id: int, peca_id: int) -> Optional[Modelo]:
        modelo = self.buscar_por_id(modelo_id)
        if not modelo:
            return None
        peca = self.db.query(Peca).filter(Peca.id == peca_id).first()
        if not peca:
            return None
        if peca not in modelo.pecas:
            modelo.pecas.append(peca)
            self.db.commit()
            self.db.refresh(modelo)
        return modelo

    def remover_peca(self, modelo_id: int, peca_id: int) -> Optional[Modelo]:
        modelo = self.buscar_por_id(modelo_id)
        if not modelo:
            return None
        peca = self.db.query(Peca).filter(Peca.id == peca_id).first()
        if peca and peca in modelo.pecas:
            modelo.pecas.remove(peca)
            self.db.commit()
            self.db.refresh(modelo)
        return modelo

    def listar_pecas(self, modelo_id: int) -> list[Peca]:
        modelo = self.buscar_por_id(modelo_id)
        if not modelo:
            return []
        return modelo.pecas


    def deletar(self, modelo_id: int) -> bool:
        modelo = self.buscar_por_id(modelo_id)
        if not modelo:
            return False
        self.db.delete(modelo)
        self.db.commit()
        return True