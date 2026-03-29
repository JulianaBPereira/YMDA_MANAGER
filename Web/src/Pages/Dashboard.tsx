import { useState, useEffect } from 'react';

import MenuLateral from '../Components/MenuLateral/MenuLateral';
import TopBar from '../Components/topBar/TopBar';


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
}

const Card = ({
  posto,
  mod,
  peca_nome,
  qtd_real,
  operador,
  habilitado,
  turno,
  operacao_nome,
  comentario,
  comentario_aviso,
}: DashboardCardProps) => {
  const statusAtivo = habilitado !== false;
  const statusTexto = statusAtivo ? 'Habilitado' : 'Desabilitado';
  const quantidadeTexto = `${qtd_real || 0} pcs / ${peca_nome || mod || 'sem modelo'}`;

  return (
    <article className="overflow-hidden rounded border border-[#d3d6dc] bg-[#f4f5f7] shadow-sm">
      <header className="flex items-center justify-between border-b border-[#6c8fb4] bg-[#5b83b2] px-2 py-1">
        <h3 className="text-[11px] font-semibold text-white">{posto}</h3>
        <span className="flex items-center gap-1 text-[10px] text-white/95">
          <span
            className={`h-1.5 w-1.5 rounded-full ${statusAtivo ? 'bg-orange-300' : 'bg-red-300'}`}
          />
          {statusTexto}
        </span>
      </header>

      <div className="space-y-1 p-1.5">
        <div className="grid grid-cols-2 gap-1">
          <div className="min-h-11 rounded border border-[#e7cfa8] bg-[#fff8ea] p-1">
            <p className="mb-0.5 text-[9px] text-gray-500">Quantidade</p>
            <p className="text-[10px] font-medium text-gray-700">{quantidadeTexto}</p>
          </div>

          <div className="min-h-11 rounded border border-[#e7cfa8] bg-[#fff8ea] p-1">
            <p className="mb-0.5 text-[9px] text-gray-500">Operador</p>
            <p className="text-[10px] font-medium text-gray-700">{operador || 'Sem operador'}</p>
          </div>
        </div>

        <div className="rounded border border-[#d9dce2] bg-white px-1.5 py-1 text-[10px] text-gray-600">
          {operacao_nome || turno || 'Nao definido'}
        </div>

        <div className="rounded border border-[#d9dce2] bg-white px-1.5 py-1 text-[10px] text-gray-600">
          {comentario_aviso || comentario || 'Comentario...'}
        </div>
      </div>
    </article>
  );
};

const SUBLINHAS_FIXAS: Sublinha[] = [
  {
    sublinha_id: 1,
    nome: 'SUBLINHA 1',
    postos: [
      {
        posto_id: 1,
        posto: 'POSTO 1',
        mod: 'MOD 01',
        peca_nome: 'Sem peca',
        qtd_real: 0,
        operador: '',
        habilitado: true,
      },
      {
        posto_id: 2,
        posto: 'POSTO 2',
        mod: 'MOD 02',
        peca_nome: 'Sem peca',
        qtd_real: 0,
        operador: '',
        habilitado: true,
      },
      {
        posto_id: 3,
        posto: 'POSTO 3',
        mod: 'MOD 03',
        peca_nome: 'Sem peca',
        qtd_real: 0,
        operador: '',
        habilitado: true,
      },
      {
        posto_id: 4,
        posto: 'POSTO 4',
        mod: 'MOD 04',
        peca_nome: 'Sem peca',
        qtd_real: 0,
        operador: '',
        habilitado: true,
      },
    ],
  },
  {
    sublinha_id: 2,
    nome: 'SUBLINHA 2',
    postos: [
      {
        posto_id: 5,
        posto: 'POSTO 5',
        mod: 'MOD 05',
        peca_nome: 'Sem peca',
        qtd_real: 0,
        operador: '',
        habilitado: true,
      },
      {
        posto_id: 6,
        posto: 'POSTO 6',
        mod: 'MOD 06',
        peca_nome: 'Sem peca',
        qtd_real: 0,
        operador: '',
        habilitado: true,
      },
      {
        posto_id: 7,
        posto: 'POSTO 7',
        mod: 'MOD 07',
        peca_nome: 'Sem peca',
        qtd_real: 0,
        operador: '',
        habilitado: true,
      },
      {
        posto_id: 8,
        posto: 'POSTO 8',
        mod: 'MOD 08',
        peca_nome: 'Sem peca',
        qtd_real: 0,
        operador: '',
        habilitado: true,
      },
    ],
  },
  {
    sublinha_id: 3,
    nome: 'SUBLINHA 3',
    postos: [
      {
        posto_id: 9,
        posto: 'POSTO 9',
        mod: 'MOD 09',
        peca_nome: 'Sem peca',
        qtd_real: 0,
        operador: '',
        habilitado: true,
      },
      {
        posto_id: 10,
        posto: 'POSTO 10',
        mod: 'MOD 10',
        peca_nome: 'Sem peca',
        qtd_real: 0,
        operador: '',
        habilitado: true,
      },
      {
        posto_id: 11,
        posto: 'POSTO 11',
        mod: 'MOD 11',
        peca_nome: 'Sem peca',
        qtd_real: 0,
        operador: '',
        habilitado: true,
      },
      {
        posto_id: 12,
        posto: 'POSTO 12',
        mod: 'MOD 12',
        peca_nome: 'Sem peca',
        qtd_real: 0,
        operador: '',
        habilitado: true,
      },
    ],
  },
];

const Dashboard = () => {
  const processos = [
    { id: 'sub_linha_chassi', nome: 'SUB LINHA CHASSI' },
  ];

  const [processoSelecionado, setProcessoSelecionado] = useState('sub_linha_chassi');
  const [selectAberto, setSelectAberto] = useState(false);
  const [sublinhas, setSublinhas] = useState<Sublinha[]>([]);
  const [carregando, setCarregando] = useState(false);

  // Removido: WebSocket e chamadas ao backend antigo
  useEffect(() => {
    setCarregando(false);
    setSublinhas([]);
  }, []);

  const sublinhasExibidas = sublinhas.length > 0 ? sublinhas : SUBLINHAS_FIXAS;

  // Removido: funções que chamavam o backend antigo

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

          {carregando ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Carregando dados do dashboard...</p>
            </div>
          ) : (
            sublinhasExibidas.map((sublinha) => (
              <div key={sublinha.sublinha_id} className="mb-6">
                <h2 className="text-lg font-bold text-gray-800 mb-3">{sublinha.nome}</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {sublinha.postos.map((item) => (
                    <Card
                      key={`${sublinha.sublinha_id}-${item.posto_id}`}
                      posto={item.posto}
                      mod={item.mod}
                      peca_nome={item.peca_nome || 'Sem peça'}
                      qtd_real={item.qtd_real || 0}
                      operador={item.operador}
                      habilitado={item.habilitado}
                      turno={item.turno}
                      operacao_nome={item.operacao_nome}
                      comentario={item.comentario}
                      comentario_aviso={item.comentario_aviso}
                      registro_id={item.registro_id}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </main>
      </div>
    </div>
  )
}

export default Dashboard;