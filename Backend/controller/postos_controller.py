from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..Database.database import get_db
from ..DAO.postos_dao import PostosDAO
from ..Services.postos_service import PostosService
from ..Schema.postosSchema import PostoCreate, PostoUpdate, PostoResponse


router = APIRouter(prefix="/postos", tags=["Postos"])


@router.get("/", response_model=list[PostoResponse])
def listar(db: Session = Depends(get_db)):
    service = PostosService(PostosDAO(db))
    return service.listar_postos()


@router.get("/{posto_id}", response_model=PostoResponse)
def buscar(posto_id: int, db: Session = Depends(get_db)):
    service = PostosService(PostosDAO(db))
    posto = service.dao.buscar_por_id(posto_id)
    if not posto:
        raise HTTPException(status_code=404, detail="Posto não encontrado")
    return posto


@router.post("/", response_model=PostoResponse, status_code=201)
def criar(body: PostoCreate, db: Session = Depends(get_db)):
    service = PostosService(PostosDAO(db))
    try:
        return service.criar_posto(body.nome.strip(), body.sublinha_id, body.dispositivo_id)
    except ValueError as e:
        # Conflito por duplicidade
        raise HTTPException(status_code=409, detail=str(e))


@router.put("/{posto_id}", response_model=PostoResponse)
def atualizar(posto_id: int, body: PostoUpdate, db: Session = Depends(get_db)):
    service = PostosService(PostosDAO(db))
    try:
        return service.atualizar_posto(
            posto_id,
            nome=body.nome.strip() if isinstance(body.nome, str) else None,
            sublinha_id=body.sublinha_id,
            dispositivo_id=body.dispositivo_id,
        )
    except ValueError as e:
        # Se mensagem indicar não encontrado -> 404, senão 409 por duplicidade
        msg = str(e)
        if "não encontrado" in msg:
            raise HTTPException(status_code=404, detail=msg)
        raise HTTPException(status_code=409, detail=msg)


@router.delete("/{posto_id}", status_code=204)
def deletar(posto_id: int, db: Session = Depends(get_db)):
    service = PostosService(PostosDAO(db))
    try:
        service.deletar_posto(posto_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

