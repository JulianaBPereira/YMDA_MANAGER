from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..Database.database import get_db
from ..Services.funcionarios_service import FuncionarioService
from ..Schema.funcionariosSchema import (
    FuncionarioCreate,
    FuncionarioUpdate,
    FuncionarioResponse,
    TagTemporariaSet,
)

router = APIRouter(prefix="/funcionarios", tags=["Funcionários"])


@router.get("/", response_model=list[FuncionarioResponse])
def listar(db: Session = Depends(get_db)):
    service = FuncionarioService(db)
    return service.listar()


@router.get("/{funcionario_id}", response_model=FuncionarioResponse)
def buscar(funcionario_id: int, db: Session = Depends(get_db)):
    try:
        service = FuncionarioService(db)
        return service.buscar_por_id(funcionario_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/", response_model=FuncionarioResponse, status_code=201)
def cadastrar(dados: FuncionarioCreate, db: Session = Depends(get_db)):
    try:
        service = FuncionarioService(db)
        return service.cadastrar(dados)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{funcionario_id}", response_model=FuncionarioResponse)
def atualizar(funcionario_id: int, dados: FuncionarioUpdate, db: Session = Depends(get_db)):
    try:
        service = FuncionarioService(db)
        return service.atualizar(funcionario_id, dados)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{funcionario_id}", status_code=204)
def deletar(funcionario_id: int, db: Session = Depends(get_db)):
    try:
        service = FuncionarioService(db)
        service.deletar(funcionario_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{funcionario_id}/tag-temporaria", response_model=FuncionarioResponse)
def adicionar_tag_temporaria(funcionario_id: int, dados: TagTemporariaSet, db: Session = Depends(get_db)):
    try:
        service = FuncionarioService(db)
        return service.adicionar_tag_temporaria(funcionario_id, dados.tag_temporaria)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{funcionario_id}/tag-temporaria", response_model=FuncionarioResponse)
def remover_tag_temporaria(funcionario_id: int, db: Session = Depends(get_db)):
    try:
        service = FuncionarioService(db)
        return service.remover_tag_temporaria(funcionario_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/tag-temporaria/limpar-expiradas", status_code=200)
def limpar_tags_expiradas(db: Session = Depends(get_db)):
    service = FuncionarioService(db)
    total = service.limpar_tags_expiradas()
    return {"mensagem": f"{total} tag(s) expirada(s) removida(s) com sucesso."}
