from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..Database.database import get_db
from ..DAO.RegistroProducao_dao import RegistroProducaoDAO
from ..Services.registros_producao_service import RegistroProducaoService
from ..Schema.registrosProducaoSchema import (
	RegistroCreate,
	RegistroUpdate,
	RegistroFinalizar,
	RegistroResponse,
)


router = APIRouter(prefix="/registros-producao", tags=["Registros de Produção"])


@router.get("/", response_model=list[RegistroResponse])
def listar(db: Session = Depends(get_db)):
	service = RegistroProducaoService(RegistroProducaoDAO(db))
	return service.listar()


@router.get("/em-aberto", response_model=list[RegistroResponse])
def listar_em_aberto(db: Session = Depends(get_db)):
	service = RegistroProducaoService(RegistroProducaoDAO(db))
	return service.listar_em_aberto()


@router.get("/{registro_id}", response_model=RegistroResponse)
def buscar(registro_id: int, db: Session = Depends(get_db)):
	service = RegistroProducaoService(RegistroProducaoDAO(db))
	registro = service.buscar(registro_id)
	if not registro:
		raise HTTPException(status_code=404, detail="Registro não encontrado")
	return registro


@router.post("/", response_model=RegistroResponse, status_code=201)
def criar(body: RegistroCreate, db: Session = Depends(get_db)):
	service = RegistroProducaoService(RegistroProducaoDAO(db))
	try:
		return service.criar(
			funcionario_id=body.funcionario_id,
			operacao_id=body.operacao_id,
			data_inicio=body.data_inicio,
			data_fim=body.data_fim,
			horario_inicio=body.horario_inicio,
			horario_fim=body.horario_fim,
		)
	except ValueError as e:
		raise HTTPException(status_code=400, detail=str(e))


@router.put("/{registro_id}/finalizar", response_model=RegistroResponse)
def finalizar(registro_id: int, body: RegistroFinalizar, db: Session = Depends(get_db)):
	service = RegistroProducaoService(RegistroProducaoDAO(db))
	try:
		return service.finalizar(registro_id, body.data_fim, body.horario_fim)
	except ValueError as e:
		raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{registro_id}", status_code=204)
def deletar(registro_id: int, db: Session = Depends(get_db)):
	service = RegistroProducaoService(RegistroProducaoDAO(db))
	try:
		service.deletar(registro_id)
	except ValueError as e:
		raise HTTPException(status_code=404, detail=str(e))

