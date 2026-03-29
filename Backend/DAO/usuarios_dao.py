# DAO
from sqlalchemy.orm import Session
from datetime import datetime
from ..Model.Usuarios import Usuario, RoleEnum

class UsuariosDAO:
    def __init__(self, db: Session):
        self.db = db

    def buscar_por_id(self, usuario_id: int):
        return (
            self.db.query(Usuario)
            .filter(Usuario.id == usuario_id)
            .first()
        )

    def buscar_por_username(self, username: str):
        return (
            self.db.query(Usuario)
            .filter(Usuario.username == username, Usuario.ativo == True)
            .first()
        )

    def listar(self):
        return (
            self.db.query(Usuario)
            .order_by(Usuario.id.desc())
            .all()
        )

    def listar_por_role(self, role: RoleEnum):
        return (
            self.db.query(Usuario)
            .filter(Usuario.role == role, Usuario.ativo == True)
            .all()
        )

    def salvar(self, usuario: Usuario):
        self.db.add(usuario)
        self.db.commit()
        self.db.refresh(usuario)
        return usuario

    def deletar(self, usuario: Usuario):
        self.db.delete(usuario)
        self.db.commit()
        return True