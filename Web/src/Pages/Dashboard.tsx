import { useState, useEffect, useRef } from 'react';

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

const Dashboard = () => {
  const processos = [
    { id: 'sub_linha_chassi', nome: 'SUB LINHA CHASSI' },
  ];

  const [processoSelecionado, setProcessoSelecionado] = useState('sub_linha_chassi');
  const [selectAberto, setSelectAberto] = useState(false);
  const [sublinhas, setSublinhas] = useState<Sublinha[]>([]);
  const [carregando, setCarregando] = useState(false);
  const dadosCarregados = useRef(false);

  // Removido: WebSocket e chamadas ao backend antigo
  useEffect(() => {
    setCarregando(false);
  }, []);

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
                <i className={`bi bi-chevron-${selectAberto ? 'up' : 'down'} ml-2 flex-shrink-0`}></i>
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
          ) : sublinhas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Nenhum posto encontrado</p>
            </div>
          ) : (
            sublinhas.map((sublinha) => (
              <div key={sublinha.sublinha_id} className="mb-6">
                <h2 className="text-lg font-bold text-gray-800 mb-3">{sublinha.nome}</h2>
                <div className="grid grid-cols-4 gap-3">
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