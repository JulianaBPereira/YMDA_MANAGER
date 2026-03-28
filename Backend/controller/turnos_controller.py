from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..Database.database import get_db
from ..Model.Funcionarios import Turnos

router = APIRouter(prefix="/turnos", tags=["Turnos"])


@router.get("/", response_model=list[dict])
def listar_turnos(db: Session = Depends(get_db)):
	turnos = db.query(Turnos).all()
	return [{"id": t.id, "nome": t.nome} for t in turnos]


@router.post("/", response_model=dict, status_code=201)
def criar_turno(payload: dict, db: Session = Depends(get_db)):
	nome = (payload.get("nome") or "").strip()
	if not nome:
		raise HTTPException(status_code=400, detail="Nome do turno é obrigatório.")

	# Evitar duplicidade simples por nome
	existe = db.query(Turnos).filter(Turnos.nome.ilike(nome)).first()
	if existe:
		return {"id": existe.id, "nome": existe.nome}

	novo = Turnos(nome=nome)
	db.add(novo)
	db.commit()
	db.refresh(novo)
	return {"id": novo.id, "nome": novo.nome}

