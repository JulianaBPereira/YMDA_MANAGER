from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..Database.database import get_db
from ..DAO.modelos_dao import ModeloDAO
from ..Services.modelos_service import ModeloService
from ..Schema.modelosSchema import ModeloCreate, ModeloUpdate, ModeloResponse
from ..Schema.pecasSchema import PecaResponse


router = APIRouter(prefix="/modelos", tags=["Modelos"])


@router.get("/", response_model=list[ModeloResponse])
def listar(db: Session = Depends(get_db)):
	service = ModeloService(ModeloDAO(db))
	return service.listar()


@router.get("/por-produto/{produto_id}", response_model=list[ModeloResponse])
def listar_por_produto(produto_id: int, db: Session = Depends(get_db)):
	service = ModeloService(ModeloDAO(db))
	return service.listar_por_produto(produto_id)


@router.get("/{modelo_id}", response_model=ModeloResponse)
def buscar(modelo_id: int, db: Session = Depends(get_db)):
	service = ModeloService(ModeloDAO(db))
	modelo = service.buscar(modelo_id)
	if not modelo:
		raise HTTPException(status_code=404, detail="Modelo não encontrado")
	return modelo


@router.post("/", response_model=ModeloResponse, status_code=201)
def criar(body: ModeloCreate, db: Session = Depends(get_db)):
	service = ModeloService(ModeloDAO(db))
	try:
		return service.criar(body.nome, body.produto_id)
	except ValueError as e:
		raise HTTPException(status_code=400, detail=str(e))


@router.put("/{modelo_id}", response_model=ModeloResponse)
def atualizar(modelo_id: int, body: ModeloUpdate, db: Session = Depends(get_db)):
	service = ModeloService(ModeloDAO(db))
	try:
		return service.atualizar(modelo_id, body.nome, body.produto_id)
	except ValueError as e:
		raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{modelo_id}", status_code=204)
def deletar(modelo_id: int, db: Session = Depends(get_db)):
	service = ModeloService(ModeloDAO(db))
	try:
		service.deletar(modelo_id)
	except ValueError as e:
		raise HTTPException(status_code=404, detail=str(e))


@router.post("/{modelo_id}/pecas/{peca_id}", response_model=ModeloResponse)
def adicionar_peca(modelo_id: int, peca_id: int, db: Session = Depends(get_db)):
	service = ModeloService(ModeloDAO(db))
	try:
		return service.adicionar_peca(modelo_id, peca_id)
	except ValueError as e:
		raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{modelo_id}/pecas/{peca_id}", response_model=ModeloResponse)
def remover_peca(modelo_id: int, peca_id: int, db: Session = Depends(get_db)):
	service = ModeloService(ModeloDAO(db))
	try:
		return service.remover_peca(modelo_id, peca_id)
	except ValueError as e:
		raise HTTPException(status_code=400, detail=str(e))


@router.get("/{modelo_id}/pecas", response_model=list[PecaResponse])
def listar_pecas(modelo_id: int, db: Session = Depends(get_db)):
	service = ModeloService(ModeloDAO(db))
	return service.listar_pecas(modelo_id)

