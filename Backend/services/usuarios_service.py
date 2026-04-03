from datetime import datetime
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from ..DAO.usuarios_dao import UsuariosDAO
from ..Model.Usuarios import Usuario

class UsuarioService:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    def __init__(self, db: Session):
        self.dao = UsuariosDAO(db)
    
    def criar_usuario(self, nome: str, username: str, senha: str, role: str = 'operador'):
        if self.dao.buscar_por_username(username):
            raise ValueError("Username já cadastrado")
        
        novo_usuario = Usuario(
            nome=nome,
            username=username,
            senha_hash=self.pwd_context.hash(senha),
            role=role,
            data_criacao=datetime.now()
        )
        return self.dao.salvar(novo_usuario)

    def atualizar_usuario(self, usuario_id: int, **dados):
        usuario = self.dao.buscar_por_id(usuario_id)
        if not usuario:
            raise ValueError("Usuário não encontrado")
        
        if 'senha' in dados:
            usuario.senha_hash = self.pwd_context.hash(dados.pop('senha'))
            
        for campo, valor in dados.items():
            if hasattr(usuario, campo) and valor is not None:
                setattr(usuario, campo, valor)

        return self.dao.salvar(usuario)
    
    def desativar_usuario(self, usuario_id: int):
        usuario = self.dao.buscar_por_id(usuario_id)
        if usuario:
            usuario.ativo = False
            usuario.data_remocao = datetime.now()
            self.dao.salvar(usuario)
        return usuario

    def deletar_usuario(self, usuario_id: int):
        usuario = self.dao.buscar_por_id(usuario_id)
        if not usuario:
            raise ValueError("Usuário não encontrado")
        self.dao.deletar(usuario)
        return True

    def listar_usuarios(self):
        return self.dao.listar()

    def autenticar(self, username: str, senha: str):
        """Autentica um usuário e retorna seus dados se credenciais forem válidas"""
        usuario = self.dao.buscar_por_username(username)
        if not usuario:
            raise ValueError("Usuário não encontrado")
        
        if not usuario.ativo:
            raise ValueError("Usuário inativo")
        
        if not self.pwd_context.verify(senha, usuario.senha_hash):
            raise ValueError("Senha incorreta")
        
        return usuario