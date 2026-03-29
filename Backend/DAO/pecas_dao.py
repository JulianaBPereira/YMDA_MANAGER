from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..Model.Produtos import Peca


class PecaDAO:

    def __init__(self, db: Session):
        self.db = db

    def criar(self, nome: str, codigo: str) -> Peca:
        peca = Peca(nome=nome, codigo=codigo)
        self.db.add(peca)
        self.db.commit()
        self.db.refresh(peca)
        return peca

    def existe_por_codigo(self, codigo: str) -> bool:
        return (
            self.db.query(Peca)
            .filter(func.lower(Peca.codigo) == codigo.lower())
            .first()
            is not None
        )

    def existe_por_codigo_excluindo_id(self, peca_id: int, codigo: str) -> bool:
        return (
            self.db.query(Peca)
            .filter(
                Peca.id != peca_id,
                func.lower(Peca.codigo) == codigo.lower(),
            )
            .first()
            is not None
        )


    def buscar_por_id(self, peca_id: int) -> Optional[Peca]:
        return self.db.query(Peca).filter(Peca.id == peca_id).first()


    def listar_todos(self) -> list[Peca]:
        return self.db.query(Peca).all()

    def atualizar(
        self,
        peca_id: int,
        novo_nome: Optional[str] = None,
        novo_codigo: Optional[str] = None,
    ) -> Optional[Peca]:
        peca = self.buscar_por_id(peca_id)
        if not peca:
            return None
        if novo_nome is not None:
            peca.nome = novo_nome
        if novo_codigo is not None:
            peca.codigo = novo_codigo
        self.db.commit()
        self.db.refresh(peca)
        return peca

    def deletar(self, peca_id: int) -> bool:
        peca = self.buscar_por_id(peca_id)
        if not peca:
            return False
        self.db.delete(peca)
        self.db.commit()
        return True