from ..DAO.postos_dao import PostosDAO

class PostosService:
    def __init__(self, dao: PostosDAO):
        self.dao = dao

    def criar_posto(self, nome: str, sublinha_id: int, dispositivo_id: int = None):
        return self.dao.criar(nome, sublinha_id, dispositivo_id)

    def atualizar_posto(self, posto_id: int, nome: str = None, sublinha_id: int = None, dispositivo_id: int = None):
        posto = self.dao.buscar_por_id(posto_id)
        if not posto:
            raise ValueError(f"Posto {posto_id} não encontrado")
        return self.dao.atualizar(posto, nome, sublinha_id, dispositivo_id)

    def deletar_posto(self, posto_id: int):
        posto = self.dao.buscar_por_id(posto_id)
        if not posto:
            raise ValueError(f"Posto {posto_id} não encontrado")
        self.dao.deletar(posto)

    def listar_postos(self):
        return self.dao.listar()