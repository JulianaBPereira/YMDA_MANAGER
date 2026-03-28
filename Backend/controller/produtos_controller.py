from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..Database.database import get_db
from ..DAO.produtos_dao import ProdutoDAO
from ..Services.produtos_service import ProdutoService
from ..Schema.produtosSchema import ProdutoCreate, ProdutoUpdate, ProdutoResponse


router = APIRouter(prefix="/produtos", tags=["Produtos"])


@router.get("/", response_model=list[ProdutoResponse])
def listar(db: Session = Depends(get_db)):
	service = ProdutoService(ProdutoDAO(db))
	return service.listar()


@router.get("/{produto_id}", response_model=ProdutoResponse)
def buscar(produto_id: int, db: Session = Depends(get_db)):
	service = ProdutoService(ProdutoDAO(db))
	produto = service.buscar(produto_id)
	if not produto:
		raise HTTPException(status_code=404, detail="Produto não encontrado")
	return produto


@router.post("/", response_model=ProdutoResponse, status_code=201)
def criar(body: ProdutoCreate, db: Session = Depends(get_db)):
	service = ProdutoService(ProdutoDAO(db))
	try:
		return service.criar(body.nome)
	except ValueError as e:
		raise HTTPException(status_code=400, detail=str(e))


@router.put("/{produto_id}", response_model=ProdutoResponse)
def atualizar(produto_id: int, body: ProdutoUpdate, db: Session = Depends(get_db)):
	service = ProdutoService(ProdutoDAO(db))
	try:
		return service.atualizar_nome(produto_id, body.nome)
	except ValueError as e:
		raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{produto_id}", status_code=204)
def remover(produto_id: int, db: Session = Depends(get_db)):
	service = ProdutoService(ProdutoDAO(db))
	try:
		service.remover(produto_id)
	except ValueError as e:
		raise HTTPException(status_code=404, detail=str(e))

