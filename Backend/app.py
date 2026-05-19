import sys
from pathlib import Path

_backend_root = Path(__file__).resolve().parent
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from controller.funcionarios_controller import router as funcionario_router
from controller.produtos_controller import router as produtos_router
from controller.pecas_controller import router as pecas_router
from controller.modelos_controller import router as modelos_router
from controller.linhas_controller import router as linhas_router
from controller.dispositivos_controller import router as dispositivos_router
from controller.registros_producao_controller import router as registros_router
from controller.operacoes_controller import router as operacoes_router
from controller.postos_controller import router as postos_router
from controller.turnos_controller import router as turnos_router
from controller.usuarios_controller import router as usuarios_router
from controller.ihm_controller import router as ihm_router
from database.database import SessionLocal, engine
from DAO.dispositvos_dao import DispositivosDAO
from services.dispositivos_service import DispositivosService
from sqlalchemy import text
import uvicorn
import Model  # garante que todos os modelos sejam importados e mapeados

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(funcionario_router, prefix="/api")
app.include_router(produtos_router, prefix="/api")
app.include_router(pecas_router, prefix="/api")
app.include_router(modelos_router, prefix="/api")
app.include_router(linhas_router, prefix="/api")
app.include_router(dispositivos_router, prefix="/api")
app.include_router(registros_router, prefix="/api")
app.include_router(operacoes_router, prefix="/api")
app.include_router(postos_router, prefix="/api")
app.include_router(turnos_router, prefix="/api")
app.include_router(usuarios_router, prefix="/api")
app.include_router(ihm_router, prefix="/api")


@app.on_event("startup")
def registrar_dispositivo_local_ao_iniciar():
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE operacoes ADD COLUMN IF NOT EXISTS nome VARCHAR(255)"))
        connection.execute(text("UPDATE operacoes SET nome = COALESCE(NULLIF(nome, ''), 'Operação sem nome')"))
        connection.execute(text("ALTER TABLE registros_producao ADD COLUMN IF NOT EXISTS comentario TEXT"))
        connection.execute(text("ALTER TABLE registros_producao ADD COLUMN IF NOT EXISTS quantidade INTEGER"))

    db = SessionLocal()
    try:
        service = DispositivosService(DispositivosDAO(db))
        try:
            service.ensure_local_registered()
        except ValueError:
            pass
    finally:
        db.close()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
