from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..Database.database import get_db
from ..DAO.usuarios_dao import UsuariosDAO
from ..Services.usuarios_service import UsuarioService
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/usuarios", tags=["Usuários"])


class UsuarioCreate(BaseModel):
    username: str
    nome: str
    senha: str
    role: str = "operador"
    ativo: bool = True


class UsuarioUpdate(BaseModel):
    username: Optional[str] = None
    nome: Optional[str] = None
    senha: Optional[str] = None
    role: Optional[str] = None
    ativo: Optional[bool] = None


class UsuarioLogin(BaseModel):
    username: str
    senha: str


class UsuarioResponse(BaseModel):
    id: int
    username: str
    nome: str
    role: str
    
    class Config:
        from_attributes = True


@router.post("/", status_code=201)
def criar_usuario(body: UsuarioCreate, db: Session = Depends(get_db)):
    service = UsuarioService(db)
    try:
        return service.criar_usuario(
            nome=body.nome,
            username=body.username,
            senha=body.senha,
            role=body.role,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=UsuarioResponse)
def login(body: UsuarioLogin, db: Session = Depends(get_db)):
    service = UsuarioService(db)
    try:
        usuario = service.autenticar(body.username, body.senha)
        return UsuarioResponse(
            id=usuario.id,
            username=usuario.username,
            nome=usuario.nome,
            role=usuario.role
        )
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/")
def listar_usuarios(db: Session = Depends(get_db)):
    service = UsuarioService(db)
    return service.listar_usuarios()


@router.get("/{usuario_id}")
def buscar_usuario(usuario_id: int, db: Session = Depends(get_db)):
    dao = UsuariosDAO(db)
    usuario = dao.buscar_por_id(usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return usuario


@router.put("/{usuario_id}")
def atualizar_usuario(usuario_id: int, body: UsuarioUpdate, db: Session = Depends(get_db)):
    service = UsuarioService(db)
    try:
        dados = body.model_dump(exclude_none=True)
        return service.atualizar_usuario(usuario_id, **dados)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{usuario_id}", status_code=204)
def deletar_usuario(usuario_id: int, db: Session = Depends(get_db)):
    service = UsuarioService(db)
    try:
        service.deletar_usuario(usuario_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
