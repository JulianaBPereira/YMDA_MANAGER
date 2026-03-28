from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .Controller.Funcionarios_controller import router as funcionario_router
from .Controller.produtos_controller import router as produtos_router
from .Controller.pecas_controller import router as pecas_router
from .Controller.modelos_controller import router as modelos_router
from .Controller.linhas_controller import router as linhas_router
from .Controller.dispositivos_controller import router as dispositivos_router
from .Controller.registros_producao_controller import router as registros_router
from .Controller.operacoes_controller import router as operacoes_router
from .Database.database import SessionLocal
from .DAO.dispositvos_dao import DispositivosDAO
from .Services.dispositivos_service import DispositivosService
import uvicorn 
from . import Model  # garante que todos os modelos sejam importados e mapeados

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


@app.on_event("startup")
def registrar_dispositivo_local_ao_iniciar():
    db = SessionLocal()
    try:
        service = DispositivosService(DispositivosDAO(db))
        service.ensure_local_registered()
    finally:
        db.close()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
