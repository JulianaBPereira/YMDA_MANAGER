from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..Database.database import get_db
from ..DAO.dispositvos_dao import DispositivosDAO
from ..Services.dispositivos_service import DispositivosService
from ..Schema.dispositivosSchema import DispositivoCreate, DispositivoUpdate, DispositivoResponse


router = APIRouter(prefix="/dispositivos", tags=["Dispositivos"])


@router.get("/", response_model=list[DispositivoResponse])
def listar(db: Session = Depends(get_db)):
	service = DispositivosService(DispositivosDAO(db))
	return service.listar()


@router.get("/{dispositivo_id}", response_model=DispositivoResponse)
def buscar(dispositivo_id: int, db: Session = Depends(get_db)):
	service = DispositivosService(DispositivosDAO(db))
	dispositivo = service.buscar(dispositivo_id)
	if not dispositivo:
		raise HTTPException(status_code=404, detail="Dispositivo não encontrado")
	return dispositivo


@router.post("/", response_model=DispositivoResponse, status_code=201)
def criar(body: DispositivoCreate, db: Session = Depends(get_db)):
	service = DispositivosService(DispositivosDAO(db))
	try:
		return service.criar(body.nome, body.serial_number)
	except ValueError as e:
		raise HTTPException(status_code=400, detail=str(e))


@router.put("/{dispositivo_id}", response_model=DispositivoResponse)
def editar(dispositivo_id: int, body: DispositivoUpdate, db: Session = Depends(get_db)):
	service = DispositivosService(DispositivosDAO(db))
	try:
		return service.editar(dispositivo_id, body.nome, body.serial_number)
	except ValueError as e:
		raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{dispositivo_id}", status_code=204)
def deletar(dispositivo_id: int, db: Session = Depends(get_db)):
	service = DispositivosService(DispositivosDAO(db))
	service.deletar(dispositivo_id)


@router.post("/registrar-local", response_model=DispositivoResponse)
def registrar_local(db: Session = Depends(get_db)):
	service = DispositivosService(DispositivosDAO(db))
	try:
		return service.ensure_local_registered()
	except ValueError as e:
		raise HTTPException(status_code=400, detail=str(e))

