from sqlalchemy.orm import Session, joinedload
from ..Model.Linhas import Linha, Sublinha


class LinhasDAO:
    def __init__(self, db: Session):
        self.db = db

    def criar_linha(self, nome: str):
        try:
            novo = Linha(nome=nome)
            self.db.add(novo)
            self.db.commit()
            self.db.refresh(novo)
            return novo
        except:
            self.db.rollback()
            raise

    def atualizar_linha(self, linha_id: int, nome: str):
        linha = self.db.query(Linha).filter(Linha.id == linha_id).first()

        if not linha:
            return None

        try:
            linha.nome = nome
            self.db.commit()
            self.db.refresh(linha)
            return linha
        except:
            self.db.rollback()
            raise

    def deletar_linha(self, linha_id: int):
        linha = self.db.query(Linha).filter(Linha.id == linha_id).first()

        if not linha:
            return False

        try:
            self.db.delete(linha)
            self.db.commit()
            return True
        except:
            self.db.rollback()
            raise

    def listar(self):
        return self.db.query(Linha).options(
            joinedload(Linha.sublinhas)
        ).all()


class SublinhasDAO:
    def __init__(self, db: Session):
        self.db = db

    def criar_sublinha(self, nome: str, linha_id: int):
        linha = self.db.query(Linha).filter(Linha.id == linha_id).first()

        if not linha:
            return None

        try:
            nova = Sublinha(nome=nome, linha_id=linha_id)
            self.db.add(nova)
            self.db.commit()
            self.db.refresh(nova)
            return nova
        except:
            self.db.rollback()
            raise

    def criar_linha_com_sublinha(self, nome_linha: str, nome_sublinha: str):
        try:
            nova_linha = Linha(nome=nome_linha)
            self.db.add(nova_linha)
            self.db.flush()

            nova_sublinha = Sublinha(nome=nome_sublinha, linha_id=nova_linha.id)
            self.db.add(nova_sublinha)

            self.db.commit()
            self.db.refresh(nova_linha)
            # carregue sublinhas para resposta
            _ = nova_linha.sublinhas
            return nova_linha
        except:
            self.db.rollback()
            raise

    def atualizar_sublinha(self, sublinha_id: int, nome: str, linha_id: int):
        sublinha = self.db.query(Sublinha).filter(Sublinha.id == sublinha_id).first()

        if not sublinha:
            return None

        linha = self.db.query(Linha).filter(Linha.id == linha_id).first()
        if not linha:
            return None

        try:
            sublinha.nome = nome
            sublinha.linha_id = linha_id
            self.db.commit()
            self.db.refresh(sublinha)
            return sublinha
        except:
            self.db.rollback()
            raise

    def deletar_sublinha(self, sublinha_id: int):
        sublinha = self.db.query(Sublinha).filter(Sublinha.id == sublinha_id).first()

        if not sublinha:
            return False

        try:
            self.db.delete(sublinha)
            self.db.commit()
            return True
        except:
            self.db.rollback()
            raise

    def listar(self):
        return self.db.query(Sublinha).options(
            joinedload(Sublinha.linha)
        ).all()