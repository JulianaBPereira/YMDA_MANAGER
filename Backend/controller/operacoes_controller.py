from datetime import date, time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..Database.database import get_db
from ..DAO.operacoes_dao import OperacaoDAO
from ..Services.operacoes_service import OperacaoService
from pydantic import BaseModel
from typing import Optional


router = APIRouter(prefix="/operacoes", tags=["Operações"])


class OperacaoCreate(BaseModel):
    sublinha_id: int
    posto_id: int
    produto_id: int
    modelo_id: int
    dispositivo_id: int
    data_inicio: date
    horario_inicio: time
    data_fim: Optional[date] = None
    horario_fim: Optional[time] = None


class OperacaoUpdate(BaseModel):
    sublinha_id: Optional[int] = None
    posto_id: Optional[int] = None
    produto_id: Optional[int] = None
    modelo_id: Optional[int] = None
    dispositivo_id: Optional[int] = None
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None
    horario_inicio: Optional[time] = None
    horario_fim: Optional[time] = None


@router.post("/", status_code=201)
def criar_operacao(body: OperacaoCreate, db: Session = Depends(get_db)):
    service = OperacaoService(OperacaoDAO(db))
    try:
        return service.criar_operacao(
            sublinha_id=body.sublinha_id,
            posto_id=body.posto_id,
            produto_id=body.produto_id,
            modelo_id=body.modelo_id,
            dispositivo_id=body.dispositivo_id,
            data_inicio=body.data_inicio,
            horario_inicio=body.horario_inicio,
            data_fim=body.data_fim,
            horario_fim=body.horario_fim,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/")
def listar_operacoes(db: Session = Depends(get_db)):
    service = OperacaoService(OperacaoDAO(db))
    return service.listar_operacoes()


@router.get("/{operacao_id}")
def buscar_operacao(operacao_id: int, db: Session = Depends(get_db)):
    service = OperacaoService(OperacaoDAO(db))
    try:
        return service.buscar_operacao(operacao_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{operacao_id}")
def atualizar_operacao(operacao_id: int, body: OperacaoUpdate, db: Session = Depends(get_db)):
    service = OperacaoService(OperacaoDAO(db))
    try:
        return service.atualizar_operacao(
            operacao_id=operacao_id,
            sublinha_id=body.sublinha_id,
            posto_id=body.posto_id,
            produto_id=body.produto_id,
            modelo_id=body.modelo_id,
            dispositivo_id=body.dispositivo_id,
            data_inicio=body.data_inicio,
            data_fim=body.data_fim,
            horario_inicio=body.horario_inicio,
            horario_fim=body.horario_fim,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{operacao_id}", status_code=204)
def deletar_operacao(operacao_id: int, db: Session = Depends(get_db)):
    service = OperacaoService(OperacaoDAO(db))
    try:
        service.deletar_operacao(operacao_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{operacao_id}/pecas")
def listar_pecas(operacao_id: int, db: Session = Depends(get_db)):
    service = OperacaoService(OperacaoDAO(db))
    try:
        return service.listar_pecas(operacao_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{operacao_id}/pecas/{peca_id}", status_code=201)
def adicionar_peca(operacao_id: int, peca_id: int, db: Session = Depends(get_db)):
    service = OperacaoService(OperacaoDAO(db))
    try:
        return service.adicionar_peca(operacao_id, peca_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{operacao_id}/pecas/{peca_id}", status_code=204)
def remover_peca(operacao_id: int, peca_id: int, db: Session = Depends(get_db)):
    service = OperacaoService(OperacaoDAO(db))
    try:
        service.remover_peca(operacao_id, peca_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))