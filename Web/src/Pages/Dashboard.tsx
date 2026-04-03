import { useState, useEffect, useCallback, useRef } from 'react';

import MenuLateral from '../Components/MenuLateral/MenuLateral';
import TopBar from '../Components/topBar/TopBar';
import { dashboardAPI, getDashboardWebSocketUrl } from '../api/api';


interface CardProps {
  posto_id: number;
  posto: string;
  mod: string;
  peca_nome: string;
  qtd_real: number;
  operador: string;
  habilitado: boolean | null;
  turno?: string;
  operacao_nome?: string;
  comentario?: string;
  comentario_aviso?: string;
  registro_id?: number;
}

interface Sublinha {
  sublinha_id: number;
  nome: string;
  postos: CardProps[];
}

interface OperacaoAberta {
  registro_id: number;
  operacao_id: number;
  operacao_nome: string;
  produto: string;
  modelo: string;
  peca_nome: string;
  codigo?: string | null;
  operador: string;
  turno?: string | null;
  comentario?: string | null;
  funcionario_habilitado: boolean;
  funcionario_matricula: string;
  hora_inicio?: string | null;
  data_inicio?: string | null;
}

interface DashboardPostoAPI {
  posto_id: number;
  posto: string;
  ativo: boolean;
  status: string;
  operacao_aberta: OperacaoAberta | null;
}

interface DashboardSublinhaAPI {
  sublinha_id: number;
  nome: string;
  postos: DashboardPostoAPI[];
}

interface DashboardCardProps {
  posto: string;
  mod: string;
  peca_nome: string;
  qtd_real: number;
  operador: string;
  habilitado: boolean | null;
  turno?: string;
  operacao_nome?: string;
  comentario?: string;
  comentario_aviso?: string;
  registro_id?: number;
  onEnviarComentario?: (registroId: number, comentario: string) => Promise<void>;
}

const Card = ({
  posto,
  mod,
  peca_nome,
  operador,
  habilitado,
  turno,
  operacao_nome,
  registro_id,
  onEnviarComentario,
}: DashboardCardProps) => {
  const [comentarioInput, setComentarioInput] = useState('');
  const [salvandoComentario, setSalvandoComentario] = useState(false);
  const [erroComentario, setErroComentario] = useState('');

  useEffect(() => {
    setComentarioInput('');
    setErroComentario('');
  }, [registro_id]);

  const mostrarStatus = habilitado !== null;
  const statusAtivo = habilitado === true;
  const statusTexto = statusAtivo ? 'Habilitado' : 'Nao habilitado';
  const postoAtivo = Boolean(registro_id);
  const pecaModeloTexto = postoAtivo ? `${peca_nome || ''} / ${mod || ''}` : '';
  const operacaoTexto = postoAtivo ? (operacao_nome || '') : '';
  const operadorTexto = postoAtivo ? (operador || '') : '';
  const turnoTexto = postoAtivo ? (turno || '') : '';

  return (
    <article className="overflow-hidden rounded border border-[#d3d6dc] bg-[#f4f5f7] shadow-sm">
      <header className="flex items-center justify-between border-b border-[#6c8fb4] bg-[#5b83b2] px-2 py-1">
        <h3 className="text-[11px] font-semibold text-white">{posto}</h3>
        {mostrarStatus ? (
          <span className="flex items-center gap-1 text-[10px] text-white/95">
            <span
              className={`h-1.5 w-1.5 rounded-full ${statusAtivo ? 'bg-emerald-300' : 'bg-red-300'}`}
            />
            {statusTexto}
          </span>
        ) : (
          <span />
        )}
      </header>

      <div className="space-y-1 p-1.5">
        <div className="grid grid-cols-2 gap-1">
          <div className="min-h-11 rounded border border-[#e7cfa8] bg-[#fff8ea] p-1">
            <p className="mb-0.5 text-[9px] text-gray-500">Peca / Modelo</p>
            <p className="text-[10px] font-medium text-gray-700">{pecaModeloTexto}</p>
          </div>

          <div className="min-h-11 rounded border border-[#e7cfa8] bg-[#fff8ea] p-1">
            <p className="mb-0.5 text-[9px] text-gray-500">Operacao</p>
            <p className="text-[10px] font-medium text-gray-700">{operacaoTexto}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1">
          <div className="min-h-11 rounded border border-[#e7cfa8] bg-[#fff8ea] p-1">
            <p className="mb-0.5 text-[9px] text-gray-500">Funcionario</p>
            <p className="text-[10px] font-medium text-gray-700">{operadorTexto}</p>
          </div>

          <div className="min-h-11 rounded border border-[#e7cfa8] bg-[#fff8ea] p-1">
            <p className="mb-0.5 text-[9px] text-gray-500">Turno</p>
            <p className="text-[10px] font-medium text-gray-700">{turnoTexto}</p>
          </div>
        </div>

        <input
          type="text"
          value={comentarioInput}
          onChange={(e) => setComentarioInput(e.target.value)}
          onKeyDown={async (e) => {
            if (e.key !== 'Enter' || salvandoComentario) return;
            e.preventDefault();
            if (!registro_id || !onEnviarComentario) return;
            try {
              setSalvandoComentario(true);
              setErroComentario('');
              await onEnviarComentario(registro_id, comentarioInput);
              setComentarioInput('');
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Falha ao salvar comentario';
              setErroComentario(message);
            } finally {
              setSalvandoComentario(false);
            }
          }}
          disabled={!registro_id || salvandoComentario}
          placeholder={registro_id ? (salvandoComentario ? 'Salvando comentario...' : 'Comentario (Enter para salvar)') : ''}
          className="w-full rounded border border-[#d9dce2] bg-white px-1.5 py-1 text-[10px] text-gray-700 outline-none disabled:border-transparent disabled:bg-transparent"
        />
        {erroComentario && (
          <p className="rounded border border-red-200 bg-red-50 px-1.5 py-1 text-[10px] text-red-600">
            {erroComentario}
          </p>
        )}
      </div>
    </article>
  );
};

const Dashboard = () => {
  const processos = [
    { id: 'sub_linha_chassi', nome: 'SUB LINHA CHASSI' },
  ];

  const [processoSelecionado, setProcessoSelecionado] = useState('sub_linha_chassi');
  const [selectAberto, setSelectAberto] = useState(false);
  const [sublinhas, setSublinhas] = useState<Sublinha[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string>('');
  const requisicaoAtualRef = useRef(0);

  const criarLayoutVazio = (): Sublinha[] =>
    [1, 2, 3].map((sublinhaIdx) => ({
      sublinha_id: sublinhaIdx,
      nome: `SUBLINHA ${sublinhaIdx}`,
      postos: [1, 2, 3, 4].map((postoIdx) => ({
        posto_id: postoIdx,
        posto: `POSTO ${postoIdx}`,
        mod: 'Sem modelo',
        peca_nome: 'Sem peca',
        qtd_real: 0,
        operador: '',
        habilitado: null,
        operacao_nome: 'Livre',
        comentario: '',
      })),
    }));

  const mapearSublinhas = (dados: DashboardSublinhaAPI[]): Sublinha[] => {
    return (dados || []).map((s) => ({
      sublinha_id: s.sublinha_id,
      nome: s.nome,
      postos: (s.postos || []).map((p) => ({
        posto_id: p.posto_id,
        posto: p.posto,
        mod: p.operacao_aberta?.modelo || 'Sem modelo',
        peca_nome: p.operacao_aberta?.peca_nome || 'Sem peca',
        qtd_real: p.operacao_aberta ? 1 : 0,
        operador: p.operacao_aberta?.operador || '',
        turno: p.operacao_aberta?.turno || undefined,
        comentario: p.operacao_aberta?.comentario || '',
        habilitado: p.operacao_aberta ? Boolean(p.operacao_aberta.funcionario_habilitado) : null,
        operacao_nome: p.operacao_aberta?.operacao_nome || 'Livre',
        comentario_aviso: p.status,
        registro_id: p.operacao_aberta?.registro_id,
      })),
    }));
  };

  const carregarDashboard = useCallback(async () => {
    const idRequisicao = ++requisicaoAtualRef.current;
    try {
      setCarregando(true);
      const response = await dashboardAPI.buscarPostosDashboard({ cache: 'no-store' });
      if (idRequisicao !== requisicaoAtualRef.current) {
        return;
      }
      setSublinhas(mapearSublinhas(response.sublinhas || []));
      setErro('');
    } catch (error: any) {
      if (idRequisicao !== requisicaoAtualRef.current) {
        return;
      }
      setSublinhas(criarLayoutVazio());
      setErro(error?.message || 'Falha ao carregar dashboard');
    } finally {
      if (idRequisicao === requisicaoAtualRef.current) {
        setCarregando(false);
      }
    }
  }, []);

  const enviarComentario = useCallback(async (registroId: number, comentario: string) => {
    await dashboardAPI.atualizarComentario(registroId, comentario);
    await carregarDashboard();
  }, [carregarDashboard]);

  useEffect(() => {
    carregarDashboard();

    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let ativo = true;

    const conectar = () => {
      if (!ativo) return;
      ws = new WebSocket(getDashboardWebSocketUrl());
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.type === 'dashboard_refresh') {
            carregarDashboard();
          }
        } catch {
          // ignorar mensagens inválidas
        }
      };
      ws.onclose = () => {
        if (!ativo) return;
        reconnectTimer = setTimeout(conectar, 2000);
      };
    };
    conectar();

    return () => {
      ativo = false;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      ws?.close();
    };
  }, [carregarDashboard]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.select-processo')) {
        setSelectAberto(false);
      }
    };

    if (selectAberto) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectAberto]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar />
      
      <div className="flex flex-1">
        <MenuLateral />
        
        <main className="flex-1 px-10 py-4 ml-20 mt-24"> 
          <div className="grid grid-cols-1 gap-3 mb-6 max-w-sm">
            {/* Select de Processo */}
            <div className="relative select-processo">
              <label className="block mb-2 text-sm font-medium text-gray-700 uppercase">
                Seleção do Processo
              </label>
              <button
                type="button"
                onClick={() => setSelectAberto(!selectAberto)}
                className="w-full px-4 py-3 text-white text-sm font-bold rounded-lg shadow border-2 border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase text-left flex items-center justify-between"
                style={{ backgroundColor: 'var(--bg-azul)', minHeight: '48px' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#5B9BD5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-azul)';
                }}
              >
                <span className="truncate">
                  {processos.find(p => p.id === processoSelecionado)?.nome || 'Selecione'}
                </span>
                <i className={`bi bi-chevron-${selectAberto ? 'up' : 'down'} ml-2 shrink-0`}></i>
              </button>
              
              {/* Dropdown de Opções */}
              {selectAberto && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg overflow-hidden z-50 border-2 border-gray-400" style={{ backgroundColor: 'var(--bg-azul)' }}>
                  <div className="max-h-64 overflow-y-auto">
                    {processos.map((processo) => (
                      <button
                        key={processo.id}
                        type="button"
                        onClick={() => {
                          setProcessoSelecionado(processo.id);
                          setSelectAberto(false);
                        }}
                        className="w-full px-4 py-3 text-white text-xs font-bold transition-all uppercase text-left hover:bg-blue-500 block"
                        style={{
                          backgroundColor: processoSelecionado === processo.id ? '#5B9BD5' : 'var(--bg-azul)',
                          borderLeft: processoSelecionado === processo.id ? '4px solid #4ADE80' : 'none',
                        }}
                      >
                        {processo.nome}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {carregando && sublinhas.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">Carregando dados do dashboard...</p>
            </div>
          )}

          {erro && (
            <div className="text-center py-2 mb-4">
              <p className="text-red-600 text-sm">{erro}</p>
            </div>
          )}

          {sublinhas.map((sublinha) => (
          <div key={sublinha.sublinha_id} className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-3">{sublinha.nome}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {sublinha.postos.map((item) => (
                <Card
                  key={`${sublinha.sublinha_id}-${item.posto_id}`}
                  posto={item.posto}
                  mod={item.mod}
                  peca_nome={item.peca_nome}
                  qtd_real={item.qtd_real || 0}
                  operador={item.operador}
                  habilitado={item.habilitado}
                  turno={item.turno}
                  operacao_nome={item.operacao_nome}
                  comentario={item.comentario}
                  comentario_aviso={item.comentario_aviso}
                  registro_id={item.registro_id}
                  onEnviarComentario={enviarComentario}
                />
              ))}
            </div>
          </div>
          ))}
        </main>
      </div>
    </div>
  )
}

export default Dashboard;