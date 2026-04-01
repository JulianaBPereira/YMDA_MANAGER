from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload, selectinload

from ..DAO.RegistroProducao_dao import RegistroProducaoDAO
from ..Database.database import get_db
from ..Model.Funcionarios import Funcionario
from ..Model.Operacoes import Operacao
from ..Model.Postos import Posto
from ..Model.RegistroProdução import RegistroProducao
from ..Services.funcionarios_service import FuncionarioService
from ..Services.registros_producao_service import RegistroProducaoService
from ..Services.dashboard_ws_service import manager as dashboard_ws_manager


router = APIRouter(prefix="/ihm", tags=["IHM"])


class RegistroEntradaBody(BaseModel):
    posto: str | None = None
    funcionario_matricula: str
    modelo_codigo: str | None = None
    operacao: str | None = None
    peca: str | None = None
    codigo: str | None = None


class RegistroSaidaBody(BaseModel):
    posto: str | None = None
    funcionario_matricula: str | None = None
    registro_id: int | None = None
    quantidade: int | None = None
    comentario: str | None = None


def _resolver_funcionario_por_operador(db: Session, operador: str) -> Funcionario | None:
    return (
        db.query(Funcionario)
        .filter(Funcionario.nome == operador)
        .first()
    )


@router.get("/rfid/{codigo}")
def validar_rfid(codigo: str, db: Session = Depends(get_db)):
    try:
        funcionario = FuncionarioService(db).buscar_por_tag(codigo)
    except ValueError:
        return {"status": "error"}

    return {
        "status": "success",
        "funcionario": {
            "id": funcionario.id,
            "nome": funcionario.nome,
            "matricula": funcionario.matricula,
            "tag": funcionario.tag,
        },
    }


@router.get("/contexto-operacao/{operador}")
def buscar_contexto_operacao(operador: str, db: Session = Depends(get_db)):
    funcionario = _resolver_funcionario_por_operador(db, operador)
    if not funcionario:
        raise HTTPException(status_code=404, detail="Operador não encontrado")

    operacoes_fonte = (
        db.query(Operacao)
        .options(
            joinedload(Operacao.produto),
            joinedload(Operacao.modelo),
            joinedload(Operacao.posto),
            selectinload(Operacao.pecas),
        )
        .order_by(Operacao.id.asc())
        .all()
    )

    operacoes: list[dict] = []
    for op in operacoes_fonte:
        produto_nome = op.produto.nome if op.produto else ""
        modelo_nome = op.modelo.nome if op.modelo else ""
        posto_nome = op.posto.nome if op.posto else ""
        pecas = [{"nome": p.nome, "codigo": p.codigo} for p in op.pecas]
        codigos = [p.codigo for p in op.pecas if p.codigo]
        operacoes.append(
            {
                "id": op.id,
                "codigo": str(op.id),
                "nome": op.nome,
                "produto": produto_nome,
                "modelo": {
                    "id": op.modelo_id or 0,
                    "codigo": str(op.modelo_id or ""),
                    "descricao": modelo_nome,
                },
                "posto": posto_nome,
                "pecas": pecas,
                "codigos": codigos,
            }
        )

    return {
        "funcionario": {
            "id": funcionario.id,
            "nome": funcionario.nome,
            "matricula": funcionario.matricula,
        },
        "operacoes": operacoes,
    }


@router.get("/producao/registro-aberto")
def buscar_registro_aberto(
    posto: str,
    funcionario_matricula: str,
    db: Session = Depends(get_db),
):
    query = (
        db.query(RegistroProducao)
        .join(Funcionario, RegistroProducao.funcionario_id == Funcionario.id)
        .join(Operacao, RegistroProducao.operacao_id == Operacao.id)
        .join(Posto, Operacao.posto_id == Posto.id)
        .filter(Funcionario.matricula == funcionario_matricula)
        .filter(Posto.nome == posto)
        .filter(RegistroProducao.data_fim.is_(None) | RegistroProducao.horario_fim.is_(None))
        .order_by(RegistroProducao.id.desc())
    )
    registro = query.first()
    if not registro:
        return {"registro": None}
    return {
        "registro": {
            "id": registro.id,
            "hora_inicio": str(registro.horario_inicio) if registro.horario_inicio else None,
            "data": str(registro.data_inicio) if registro.data_inicio else None,
            "funcionario_matricula": funcionario_matricula,
        }
    }


@router.post("/producao/entrada")
async def registrar_entrada(body: RegistroEntradaBody, db: Session = Depends(get_db)):
    funcionario = (
        db.query(Funcionario)
        .filter(Funcionario.matricula == body.funcionario_matricula)
        .first()
    )
    if not funcionario:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado")

    operacao = None
    if body.operacao:
        try:
            operacao_id = int(body.operacao)
        except (TypeError, ValueError):
            raise HTTPException(status_code=400, detail="Operação inválida")
        operacao = (
            db.query(Operacao)
            .options(joinedload(Operacao.produto), joinedload(Operacao.posto))
            .filter(Operacao.id == operacao_id)
            .first()
        )
        if operacao is None:
            raise HTTPException(status_code=400, detail="Operação inválida")
    if operacao is None and body.posto:
        operacao = (
            db.query(Operacao)
            .options(joinedload(Operacao.produto), joinedload(Operacao.posto))
            .join(Posto, Operacao.posto_id == Posto.id)
            .filter(Posto.nome == body.posto)
            .order_by(Operacao.id.asc())
            .first()
        )
    if operacao is None:
        operacao = (
            db.query(Operacao)
            .options(joinedload(Operacao.produto), joinedload(Operacao.posto))
            .order_by(Operacao.id.asc())
            .first()
        )
    if operacao is None:
        raise HTTPException(status_code=400, detail="Nenhuma operação cadastrada para iniciar")

    agora = datetime.now()
    service = RegistroProducaoService(RegistroProducaoDAO(db))
    try:
        registro = service.criar(
            funcionario_id=funcionario.id,
            operacao_id=operacao.id,
            data_inicio=agora.date(),
            horario_inicio=agora.time().replace(microsecond=0),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    await dashboard_ws_manager.broadcast_json(
        {
            "type": "dashboard_refresh",
            "action": "entrada",
            "registro_id": registro.id,
            "posto": operacao.posto.nome if operacao.posto else None,
        }
    )

    return {
        "registro_id": registro.id,
        "hora_inicio": str(registro.horario_inicio) if registro.horario_inicio else None,
        "data": str(registro.data_inicio) if registro.data_inicio else None,
        "funcionario_matricula": funcionario.matricula,
        "produto": operacao.produto.nome if operacao.produto else "",
    }


@router.post("/producao/saida")
async def registrar_saida(body: RegistroSaidaBody, db: Session = Depends(get_db)):
    registro_id = body.registro_id

    if registro_id is None and body.posto and body.funcionario_matricula:
        query = (
            db.query(RegistroProducao)
            .join(Funcionario, RegistroProducao.funcionario_id == Funcionario.id)
            .join(Operacao, RegistroProducao.operacao_id == Operacao.id)
            .join(Posto, Operacao.posto_id == Posto.id)
            .filter(Funcionario.matricula == body.funcionario_matricula)
            .filter(Posto.nome == body.posto)
            .filter(RegistroProducao.data_fim.is_(None) | RegistroProducao.horario_fim.is_(None))
            .order_by(RegistroProducao.id.desc())
        )
        registro = query.first()
        if registro:
            registro_id = registro.id

    if registro_id is None:
        raise HTTPException(status_code=400, detail="Registro em aberto não encontrado")

    agora = datetime.now()
    service = RegistroProducaoService(RegistroProducaoDAO(db))
    try:
        registro = service.finalizar(
            registro_id=registro_id,
            data_fim=agora.date(),
            horario_fim=agora.time().replace(microsecond=0),
            comentario=body.comentario,
            quantidade=body.quantidade,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    await dashboard_ws_manager.broadcast_json(
        {
            "type": "dashboard_refresh",
            "action": "saida",
            "registro_id": registro.id,
            "posto": body.posto,
        }
    )

    return {"status": "success", "registro_id": registro.id, "comentario": registro.comentario}
