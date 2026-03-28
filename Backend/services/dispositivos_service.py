import os
import platform
import subprocess
from typing import Optional
from ..DAO.dispositvos_dao import DispositivosDAO
from ..Model.Dispositivos import DispositivoRaspberry


class DispositivosService:
	def __init__(self, dao: DispositivosDAO):
		self.dao = dao

	def listar(self) -> list[DispositivoRaspberry]:
		return self.dao.listar()

	def buscar(self, dispositivo_id: int) -> Optional[DispositivoRaspberry]:
		return self.dao.buscar_por_id(dispositivo_id)

	def criar(self, nome: str, serial_number: Optional[str] = None) -> DispositivoRaspberry:
		serial = serial_number or self._obter_serial_local()
		if not serial:
			raise ValueError("Não foi possível obter o serial do dispositivo.")
		nome = nome.strip() or "Raspberry"
		return self.dao.criar_dispositivo(serial, nome)

	def editar(self, dispositivo_id: int, nome: str, serial_number: str) -> DispositivoRaspberry:
		nome = nome.strip()
		serial_number = serial_number.strip()
		if not nome or not serial_number:
			raise ValueError("Nome e serial_number são obrigatórios.")
		editado = self.dao.editar_dispositivo(dispositivo_id, serial_number, nome)
		if editado is None:
			raise ValueError("Dispositivo não encontrado.")
		return editado

	def deletar(self, dispositivo_id: int) -> None:
		self.dao.deletar_dispositivo(dispositivo_id)

	def ensure_local_registered(self, nome_padrao: str = "Raspberry Local") -> DispositivoRaspberry:
		serial = self._obter_serial_local()
		if not serial:
			raise ValueError("Não foi possível obter o serial do dispositivo local.")
		existentes = self.dao.listar()
		for d in existentes:
			if d.serial_number == serial:
				return d
		return self.dao.criar_dispositivo(serial, nome_padrao)

	def _obter_serial_local(self) -> Optional[str]:
		# 1) Raspberry Pi: /proc/cpuinfo
		try:
			if os.path.exists("/proc/cpuinfo"):
				with open("/proc/cpuinfo", "r", encoding="utf-8") as f:
					for line in f:
						if line.lower().startswith("serial"):
							parts = line.strip().split(":")
							if len(parts) == 2:
								serial = parts[1].strip()
								if serial and serial != "0000000000000000":
									return serial
		except Exception:
			pass
		# 2) Linux fallback: /etc/machine-id
		try:
			if os.path.exists("/etc/machine-id"):
				with open("/etc/machine-id", "r", encoding="utf-8") as f:
					mid = f.read().strip()
					if mid:
						return f"linux-{mid}"
		except Exception:
			pass
		# 3) Windows fallback: wmic
		try:
			if platform.system().lower() == "windows":
				out = subprocess.check_output(["wmic", "csproduct", "get", "uuid"], text=True)
				lines = [l.strip() for l in out.splitlines() if l.strip()]
				if len(lines) >= 2:
					return f"win-{lines[1]}"
		except Exception:
			pass
		# 4) Fallback: hostname
		try:
			return f"host-{platform.node()}"
		except Exception:
			return None

