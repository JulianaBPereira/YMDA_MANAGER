from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Response, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from ..Database.database import get_db
from ..DAO.RegistroProducao_dao import RegistroProducaoDAO
from ..Services.registros_producao_service import RegistroProducaoService
from ..Model.Funcionarios import Funcionario, FuncionarioOperacoes
from ..Model.Funcionarios import FuncionarioTurnos, Turnos
from ..Model.Linhas import Sublinha
from ..Model.Operacoes import Operacao
from ..Model.Postos import Posto
from ..Model.RegistroProdução import RegistroProducao
from ..Services.dashboard_ws_service import manager as dashboard_ws_manager
from ..Schema.registrosProducaoSchema import (
	RegistroCreate,
	RegistroUpdate,
	RegistroFinalizar,
	RegistroComentarioUpdate,
	RegistroResponse,
)


router = APIRouter(prefix="/registros-producao", tags=["Registros de Produção"])


@router.websocket("/ws/dashboard")
async def dashboard_ws(websocket: WebSocket):
	await dashboard_ws_manager.connect(websocket)
	try:
		await websocket.send_json({"type": "connected", "channel": "dashboard"})
		while True:
			await websocket.receive_text()
	except WebSocketDisconnect:
		dashboard_ws_manager.disconnect(websocket)


@router.get("/", response_model=list[RegistroResponse])
def listar(db: Session = Depends(get_db)):
	service = RegistroProducaoService(RegistroProducaoDAO(db))
	return service.listar()


@router.get("/em-aberto", response_model=list[RegistroResponse])
def listar_em_aberto(db: Session = Depends(get_db)):
	service = RegistroProducaoService(RegistroProducaoDAO(db))
	return service.listar_em_aberto()


@router.get("/dashboard/postos")
def listar_dashboard_postos(db: Session = Depends(get_db)):
	postos = (
		db.query(Posto, Sublinha)
		.join(Sublinha, Posto.sublinha_id == Sublinha.id)
		.order_by(Sublinha.id.asc(), Posto.id.asc())
		.all()
	)

	registros_abertos = (
		db.query(RegistroProducao, Operacao, Funcionario, Posto)
		.join(Operacao, RegistroProducao.operacao_id == Operacao.id)
		.join(Posto, Operacao.posto_id == Posto.id)
		.join(Funcionario, RegistroProducao.funcionario_id == Funcionario.id)
		.filter((RegistroProducao.data_fim.is_(None)) | (RegistroProducao.horario_fim.is_(None)))
		.order_by(RegistroProducao.id.desc())
		.all()
	)

	turnos_por_funcionario: dict[int, str] = {}
	turnos_funcionarios = (
		db.query(FuncionarioTurnos.funcionario_id, Turnos.nome)
		.join(Turnos, FuncionarioTurnos.turno_id == Turnos.id)
		.order_by(FuncionarioTurnos.funcionario_id.asc(), Turnos.id.asc())
		.all()
	)
	for funcionario_id, turno_nome in turnos_funcionarios:
		if funcionario_id not in turnos_por_funcionario:
			turnos_por_funcionario[funcionario_id] = turno_nome

	operacoes_habilitadas = set(
		db.query(FuncionarioOperacoes.funcionario_id, FuncionarioOperacoes.operacao_id).all()
	)

	registro_por_posto: dict[int, dict] = {}
	for registro, operacao, funcionario, posto in registros_abertos:
		if posto.id in registro_por_posto:
			continue
		funcionario_habilitado = (funcionario.id, operacao.id) in operacoes_habilitadas
		peca_nome = operacao.pecas[0].nome if operacao.pecas else "Sem peca"
		codigo_peca = operacao.pecas[0].codigo if operacao.pecas and operacao.pecas[0].codigo else None
		turno_nome = turnos_por_funcionario.get(funcionario.id)
		registro_por_posto[posto.id] = {
			"registro_id": registro.id,
			"operacao_id": operacao.id,
			"operacao_nome": operacao.nome,
			"produto": operacao.produto.nome if operacao.produto else "",
			"modelo": operacao.modelo.nome if operacao.modelo else "",
			"peca_nome": peca_nome,
			"codigo": codigo_peca,
			"operador": funcionario.nome,
			"turno": turno_nome,
			"comentario": registro.comentario,
			"funcionario_habilitado": funcionario_habilitado,
			"funcionario_matricula": funcionario.matricula,
			"hora_inicio": str(registro.horario_inicio) if registro.horario_inicio else None,
			"data_inicio": str(registro.data_inicio) if registro.data_inicio else None,
		}

	sublinhas_map: dict[int, dict] = {}
	for posto, sublinha in postos:
		if sublinha.id not in sublinhas_map:
			sublinhas_map[sublinha.id] = {
				"sublinha_id": sublinha.id,
				"nome": sublinha.nome,
				"postos": [],
			}

		ativo = registro_por_posto.get(posto.id)
		sublinhas_map[sublinha.id]["postos"].append(
			{
				"posto_id": posto.id,
				"posto": posto.nome,
				"ativo": bool(ativo),
				"status": "em_operacao" if ativo else "livre",
				"operacao_aberta": ativo,
			}
		)

	return {
		"sublinhas": list(sublinhas_map.values()),
		"atualizado_em": datetime.utcnow().isoformat(),
	}


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
			comentario=body.comentario,
			quantidade=body.quantidade,
		)
	except ValueError as e:
		raise HTTPException(status_code=400, detail=str(e))


@router.put("/{registro_id}/comentario", status_code=204)
def atualizar_comentario(registro_id: int, body: RegistroComentarioUpdate, db: Session = Depends(get_db)):
	service = RegistroProducaoService(RegistroProducaoDAO(db))
	try:
		service.atualizar_comentario(registro_id, body.comentario)
		return Response(status_code=204)
	except ValueError as e:
		raise HTTPException(status_code=404, detail=str(e))


@router.put("/{registro_id}/finalizar", response_model=RegistroResponse)
async def finalizar(registro_id: int, body: RegistroFinalizar, db: Session = Depends(get_db)):
	service = RegistroProducaoService(RegistroProducaoDAO(db))
	try:
		registro = service.finalizar(registro_id, body.data_fim, body.horario_fim, body.comentario, body.quantidade)
		posto_nome = None
		if getattr(registro, "operacao", None) and getattr(registro.operacao, "posto", None):
			posto_nome = registro.operacao.posto.nome

		await dashboard_ws_manager.broadcast_json(
			{
				"type": "dashboard_refresh",
				"action": "saida",
				"registro_id": registro.id,
				"posto": posto_nome,
			}
		)

		return registro
	except ValueError as e:
		raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{registro_id}", status_code=204)
def deletar(registro_id: int, db: Session = Depends(get_db)):
	service = RegistroProducaoService(RegistroProducaoDAO(db))
	try:
		service.deletar(registro_id)
	except ValueError as e:
		raise HTTPException(status_code=404, detail=str(e))

