from sqlalchemy.orm import Session
from ..Model.Dispositivos import DispositivoRaspberry
from datetime import datetime, timezone

class DispositivosDAO:
    def __init__(self, db: Session):
        self.db = db
    
    def criar_dispositivo(self, serial_number: str, nome: str):
        novo = DispositivoRaspberry(
            serial_number=serial_number,
            nome=nome,
            data_criacao=datetime.now(timezone.utc)
        )
        self.db.add(novo)
        self.db.commit()
        self.db.refresh(novo)
        return novo
    
    def listar(self):
        return self.db.query(DispositivoRaspberry).all()
    
    def buscar_por_id(self, dispositivo_id: int):
        return self.db.query(DispositivoRaspberry).filter(DispositivoRaspberry.id == dispositivo_id).first()
    
    def deletar_dispositivo(self, dispositivo_id: int) -> None:
        dispositivo = self.db.query(DispositivoRaspberry).filter(DispositivoRaspberry.id == dispositivo_id).first()
        if dispositivo:
            self.db.delete(dispositivo)
            self.db.commit()

    def editar_dispositivo(self, dispositivo_id: int, serial_number: str, nome: str):
        dispositivo = self.db.query(DispositivoRaspberry).filter(DispositivoRaspberry.id == dispositivo_id).first()
        if not dispositivo:
            return None
        
        dispositivo.serial_number = serial_number
        dispositivo.nome = nome
        self.db.commit()
        self.db.refresh(dispositivo)
        return dispositivo