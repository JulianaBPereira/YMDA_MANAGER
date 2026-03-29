from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..Database.database import get_db
from ..DAO.pecas_dao import PecaDAO
from ..Services.pecas_service import PecaService
from ..Schema.pecasSchema import PecaCreate, PecaUpdate, PecaResponse


router = APIRouter(prefix="/pecas", tags=["Peças"])


def _peca_para_response(peca) -> PecaResponse:
	modelo = None
	if getattr(peca, "modelos", None):
		modelo = sorted(peca.modelos, key=lambda m: m.id or 0)[0]

	produto = modelo.produto if (modelo and getattr(modelo, "produto", None)) else None

	return PecaResponse(
		id=peca.id,
		nome=peca.nome,
		codigo=peca.codigo,
		data_criacao=peca.data_criacao,
		modelo_id=modelo.id if modelo else None,
		modelo_nome=modelo.nome if modelo else None,
		produto_id=produto.id if produto else None,
		produto_nome=produto.nome if produto else None,
	)


@router.get("/", response_model=list[PecaResponse])
def listar(db: Session = Depends(get_db)):
	service = PecaService(PecaDAO(db))
	pecas = service.listar()
	return [_peca_para_response(peca) for peca in pecas]


@router.get("/{peca_id}", response_model=PecaResponse)
def buscar(peca_id: int, db: Session = Depends(get_db)):
	service = PecaService(PecaDAO(db))
	peca = service.buscar(peca_id)
	if not peca:
		raise HTTPException(status_code=404, detail="Peça não encontrada")
	return _peca_para_response(peca)


@router.post("/", response_model=PecaResponse, status_code=201)
def criar(body: PecaCreate, db: Session = Depends(get_db)):
	service = PecaService(PecaDAO(db))
	try:
		peca = service.criar(body.nome, body.codigo)
		return _peca_para_response(peca)
	except ValueError as e:
		raise HTTPException(status_code=400, detail=str(e))


@router.put("/{peca_id}", response_model=PecaResponse)
def atualizar(peca_id: int, body: PecaUpdate, db: Session = Depends(get_db)):
	service = PecaService(PecaDAO(db))
	try:
		peca = service.atualizar(peca_id, body.nome, body.codigo)
		return _peca_para_response(peca)
	except ValueError as e:
		raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{peca_id}", status_code=204)
def deletar(peca_id: int, db: Session = Depends(get_db)):
	service = PecaService(PecaDAO(db))
	try:
		service.deletar(peca_id)
	except ValueError as e:
		raise HTTPException(status_code=404, detail=str(e))

