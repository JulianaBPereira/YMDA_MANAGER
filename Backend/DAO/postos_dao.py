from sqlalchemy.orm import Session
from ..Model.Postos import Posto

class PostosDAO:
    def __init__(self, db: Session):
        self.db = db
    
    def criar(self, nome: str, sublinha_id: int, dispositivo_id: int = None) -> Posto:
        novo = Posto(nome=nome, sublinha_id=sublinha_id, dispositivo_id=dispositivo_id)
        self.db.add(novo)
        self.db.commit()
        self.db.refresh(novo)
        return novo
    
    def buscar_por_id(self, posto_id: int) -> Posto | None:
        return self.db.query(Posto).filter(Posto.id == posto_id).first()

    def atualizar(self, posto: Posto, nome: str = None, sublinha_id: int = None, dispositivo_id: int = None) -> Posto:
        if nome is not None:
            posto.nome = nome
        if sublinha_id is not None:
            posto.sublinha_id = sublinha_id
        if dispositivo_id is not None:
            posto.dispositivo_id = dispositivo_id
        self.db.commit()
        self.db.refresh(posto)
        return posto

    def deletar(self, posto: Posto) -> None:
        self.db.delete(posto)
        self.db.commit()

    def listar(self) -> list[Posto]:
        return self.db.query(Posto).all()