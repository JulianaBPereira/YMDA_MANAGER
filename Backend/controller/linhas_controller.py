# Controller/LinhaController.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..Services.linhas_service import LinhaService, LinhaCompostaService, SublinhaService
from ..Database.database import get_db
from ..DAO.linhas_dao import LinhasDAO, SublinhasDAO
from ..Schema.linhaSchema import LinhaUpdate, LinhaResponse, LinhaComSublinhaCreate
from ..Schema.sublinhaSchema import SublinhaUpdate, SublinhaResponse

router = APIRouter(prefix="/linhas", tags=["Linhas"])


@router.get("/", response_model=list[LinhaResponse])
def listar(db: Session = Depends(get_db)):
    service = LinhaService(LinhasDAO(db))
    return service.listar_linhas()


@router.put("/{linha_id}", response_model=LinhaResponse)
def atualizar(linha_id: int, body: LinhaUpdate, db: Session = Depends(get_db)):
    service = LinhaService(LinhasDAO(db))
    try:
        return service.atualizar_linha(linha_id, body.nome)
    except ValueError as e:
        detail = str(e)
        # 409 para conflito de nome, 404 para não encontrada, 400 demais validações
        if "Já existe" in detail:
            status = 409
        elif "não encontrada" in detail or "não encontrado" in detail:
            status = 404
        else:
            status = 400
        raise HTTPException(status_code=status, detail=detail)


@router.delete("/{linha_id}", status_code=204)
def deletar(linha_id: int, db: Session = Depends(get_db)):                                                                                                                                                                                                                                                                
    service = LinhaService(LinhasDAO(db))
    try:                                 
        service.deletar_linha(linha_id)                                                                                                                                    
    except ValueError as e:                                         
        raise HTTPException(status_code=404, detail=str(e))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  


@router.post("/com-sublinha", response_model=LinhaResponse, status_code=201)
def criar_com_sublinha(body: LinhaComSublinhaCreate, db: Session = Depends(get_db)):
    service = LinhaCompostaService(SublinhasDAO(db))
    try:
        return service.criar_linha_com_sublinha(body.nome_linha, body.nome_sublinha)
    except ValueError as e:
        detail = str(e)
        status = 409 if "Já existe" in detail else 400
        raise HTTPException(status_code=status, detail=detail)

# ────────────────────────────────────────────────────────────────────────────────
# Sublinha endpoints
# ────────────────────────────────────────────────────────────────────────────────

@router.put("/sublinhas/{sublinha_id}", response_model=SublinhaResponse)
def atualizar_sublinha(sublinha_id: int, body: SublinhaUpdate, db: Session = Depends(get_db)):
    service = SublinhaService(SublinhasDAO(db))
    try:
        return service.atualizar_sublinha(sublinha_id, body.nome, body.linha_id)
    except ValueError as e:
        # 400 para validações (ex: nome vazio), 404 para não encontrado
        detail = str(e)
        if "Já existe" in detail:
            status = 409
        elif "não encontrada" in detail or "não encontrado" in detail:
            status = 404
        else:
            status = 400
        raise HTTPException(status_code=status, detail=detail)


@router.delete("/sublinhas/{sublinha_id}", status_code=204)
def deletar_sublinha(sublinha_id: int, db: Session = Depends(get_db)):
    service = SublinhaService(SublinhasDAO(db))
    try:
        service.deletar_sublinha(sublinha_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))