from ..DAO.postos_dao import PostosDAO

class PostosService:
    def __init__(self, dao: PostosDAO):
        self.dao = dao

    def criar_posto(self, nome: str, sublinha_id: int, dispositivo_id: int = None):
        existente = self.dao.buscar_por_combinacao(nome, sublinha_id, dispositivo_id)
        if existente:
            raise ValueError("Já existe um posto para esta sublinha e dispositivo.")
        return self.dao.criar(nome, sublinha_id, dispositivo_id)

    def atualizar_posto(self, posto_id: int, nome: str = None, sublinha_id: int = None, dispositivo_id: int = None):
        posto = self.dao.buscar_por_id(posto_id)
        if not posto:
            raise ValueError(f"Posto {posto_id} não encontrado")
        # Determinar os valores finais para checagem de duplicidade
        nome_final = nome if nome is not None else posto.nome
        sublinha_final = sublinha_id if sublinha_id is not None else posto.sublinha_id
        dispositivo_final = dispositivo_id if dispositivo_id is not None else posto.dispositivo_id
        duplicado = self.dao.buscar_outro_por_combinacao(posto_id, nome_final, sublinha_final, dispositivo_final)
        if duplicado:
            raise ValueError("Já existe um posto para esta sublinha e dispositivo.")
        return self.dao.atualizar(posto, nome, sublinha_id, dispositivo_id)

    def deletar_posto(self, posto_id: int):
        posto = self.dao.buscar_por_id(posto_id)
        if not posto:
            raise ValueError(f"Posto {posto_id} não encontrado")
        self.dao.deletar(posto)

    def listar_postos(self):
        return self.dao.listar()