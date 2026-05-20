import type { NavigateFunction } from 'react-router-dom';

export const IHM_OPERADOR_KEY = 'ihm_operador_logado';
export const IHM_SESSAO_KEY = 'ihm_sessao';
export const IHM_ROTA_KEY = 'ihm_ultima_rota';

export const IHM_ROUTES = [
  '/ihm/leitor',
  '/ihm/operacao',
  '/ihm/leitor-finalizar',
  '/ihm/finalizar-producao',
] as const;

export type IhmRoute = (typeof IHM_ROUTES)[number];

export function isIhmRoute(path: string): path is IhmRoute {
  return (IHM_ROUTES as readonly string[]).includes(path);
}

export function saveIhmRoute(pathname: string): void {
  if (isIhmRoute(pathname)) {
    try {
      localStorage.setItem(IHM_ROTA_KEY, pathname);
    } catch {
      // ignore
    }
  }
}

export function getLastIhmRoute(): IhmRoute | null {
  try {
    const route = localStorage.getItem(IHM_ROTA_KEY);
    return route && isIhmRoute(route) ? route : null;
  } catch {
    return null;
  }
}

export function isIhmOperadorLogado(): boolean {
  try {
    return !!localStorage.getItem(IHM_OPERADOR_KEY);
  } catch {
    return false;
  }
}

export type IhmSessaoData = {
  operador?: string;
  funcionarioMatricula?: string;
  posto?: string;
  operacao?: string;
  modelo?: string;
  modeloDescricao?: string;
  peca?: string;
  codigo?: string;
  produto?: string;
  pecasDisponiveis?: Array<{ nome: string; codigo: string }>;
  registroId?: number;
  quantidadeFinalizacao?: string;
  indicePecaAtualFinalizacao?: number;
};

export function getIhmSessao(): IhmSessaoData | null {
  try {
    const raw = localStorage.getItem(IHM_SESSAO_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Mescla dados da tela atual na sessão IHM (sobrevive ao fechar o app). */
export function mergeIhmSessao(patch: IhmSessaoData): void {
  try {
    const current = getIhmSessao() || {};
    localStorage.setItem(IHM_SESSAO_KEY, JSON.stringify({ ...current, ...patch }));
  } catch {
    // ignore
  }
}

function sessaoPermiteTela(path: IhmRoute, sessao: IhmSessaoData | null): boolean {
  const hasFuncionario = !!sessao?.operador;
  const hasPosto = !!sessao?.posto && !!sessao?.funcionarioMatricula;

  if (path === '/ihm/leitor') return true;
  if (path === '/ihm/operacao') return hasFuncionario;
  if (path === '/ihm/leitor-finalizar' || path === '/ihm/finalizar-producao') {
    return hasPosto && hasFuncionario;
  }
  return false;
}

/** Rota IHM para restaurar após reabrir o app sem logout. */
export function getRestorePath(): IhmRoute {
  const sessao = getIhmSessao();
  const hasFuncionario = !!sessao?.operador;
  const last = getLastIhmRoute();

  if (last && sessaoPermiteTela(last, sessao)) {
    return last;
  }

  if (hasFuncionario) return '/ihm/operacao';
  return '/ihm/leitor';
}

export function getOperadorFromSessao(): string {
  const sessao = getIhmSessao();
  return typeof sessao?.operador === 'string' ? sessao.operador : '';
}

/** Estado de navegação ao restaurar cada tela IHM. */
export function getRestoreNavigationState(path: IhmRoute): Record<string, string> | undefined {
  const sessao = getIhmSessao();
  if (!sessao) return undefined;

  if (path === '/ihm/operacao' && sessao.operador) {
    return { operador: sessao.operador };
  }

  if (
    (path === '/ihm/finalizar-producao' || path === '/ihm/leitor-finalizar') &&
    sessao.posto &&
    sessao.funcionarioMatricula
  ) {
    return {
      posto: sessao.posto,
      funcionario_matricula: sessao.funcionarioMatricula,
      ...(sessao.operador ? { operador: sessao.operador } : {}),
    };
  }

  return undefined;
}

/** Redireciona para a última tela IHM com os dados salvos. */
export function restoreIhmSession(navigate: NavigateFunction): void {
  const path = getRestorePath();
  const state = getRestoreNavigationState(path);
  navigate(path, { replace: true, ...(state ? { state } : {}) });
}

/** Limpa dados do fluxo de produção (RFID/operação), mantém login do operador. */
export function resetIhmFluxoProducao(): void {
  try {
    localStorage.removeItem(IHM_SESSAO_KEY);
    saveIhmRoute('/ihm/leitor');
  } catch {
    // ignore
  }
}

export function clearIhmPersistence(): void {
  try {
    localStorage.removeItem(IHM_OPERADOR_KEY);
    localStorage.removeItem(IHM_SESSAO_KEY);
    localStorage.removeItem(IHM_ROTA_KEY);
  } catch {
    // ignore
  }
}
