import { useState, useEffect } from 'react'
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'
import { Paginacao } from '../Components/Compartilhados/paginacao'
import ModalSucesso from '../Components/Modais/ModalSucesso'
import ModalErro from '../Components/Modais/ModalErro'
import ModalConfirmacao from '../Components/Compartilhados/ModalConfirmacao'
import { listarLinhas, atualizarLinha, deletarLinha, criarLinhaComSublinha } from '../services/linhas'


interface Sublinha {
    id: number
    linha_id: number
    nome: string
}

interface Linha {
    id: number
    nome: string
    data_criacao?: string
    sublinhas: Sublinha[]
}

const Linhas = () => {
    const [abaAtiva, setAbaAtiva] = useState<'cadastrar' | 'listar'>('cadastrar')
    
    // Estados para cadastro composto
    const [nomeLinha, setNomeLinha] = useState('')
    const [nomeSublinha, setNomeSublinha] = useState('')
    
    // Estados para listagem
    const [linhas, setLinhas] = useState<Linha[]>([])
    const [linhaEditando, setLinhaEditando] = useState<number | null>(null)
    const [nomeLinhaEditando, setNomeLinhaEditando] = useState('')
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [itensPorPagina] = useState(10)
    const [modalSucessoAberto, setModalSucessoAberto] = useState(false)
    const [modalErroAberto, setModalErroAberto] = useState(false)
    const [mensagemSucesso, setMensagemSucesso] = useState('')
    const [mensagemErro, setMensagemErro] = useState('')
    const [tituloErro, setTituloErro] = useState('Erro!')
    const [modalConfirmacaoLinhaAberto, setModalConfirmacaoLinhaAberto] = useState(false)
    const [linhaIdParaExcluir, setLinhaIdParaExcluir] = useState<number | null>(null)

    useEffect(() => {
        if (abaAtiva === 'listar') carregarLinhas()
    }, [abaAtiva])

    const carregarLinhas = async () => {
        try {
            const resp = await listarLinhas()
            const normalizadas: Linha[] = Array.isArray(resp)
                ? resp.map((l: any) => ({
                    id: l.id,
                    nome: l.nome,
                    data_criacao: l.data_criacao,
                    sublinhas: Array.isArray(l.sublinhas) ? l.sublinhas : []
                }))
                : []
            setLinhas(normalizadas)
        } catch (e: any) {
            setTituloErro('Erro!')
            setMensagemErro(e?.message || 'Erro ao carregar linhas')
            setModalErroAberto(true)
            setLinhas([])
        }
    }

    const handleCadastrarComposto = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!nomeLinha.trim() || !nomeSublinha.trim()) {
            setTituloErro('Erro!')
            setMensagemErro('Informe o nome da linha e da sublinha')
            setModalErroAberto(true)
            return
        }

        try {
            await criarLinhaComSublinha({ nome_linha: nomeLinha.trim(), nome_sublinha: nomeSublinha.trim() })
            setNomeLinha('')
            setNomeSublinha('')
            setMensagemSucesso('Linha e sublinha criadas com sucesso!')
            setModalSucessoAberto(true)
            if (abaAtiva === 'listar') await carregarLinhas()
        } catch (e: any) {
            setTituloErro('Erro!')
            setMensagemErro(e?.message || 'Erro ao criar linha e sublinha')
            setModalErroAberto(true)
        }
    }

    const handleExcluirLinha = (linhaId: number) => {
        setLinhaIdParaExcluir(linhaId)
        setModalConfirmacaoLinhaAberto(true)
    }

    const confirmarExcluirLinha = async () => {
        if (!linhaIdParaExcluir) return

        try {
            await deletarLinha(linhaIdParaExcluir)
            setModalConfirmacaoLinhaAberto(false)
            setLinhaIdParaExcluir(null)
            await carregarLinhas()
            setMensagemSucesso('Linha excluída com sucesso!')
            setModalSucessoAberto(true)
        } catch (e: any) {
            setModalConfirmacaoLinhaAberto(false)
            setLinhaIdParaExcluir(null)
            setTituloErro('Erro!')
            setMensagemErro(e?.message || 'Erro ao excluir linha')
            setModalErroAberto(true)
        }
    }



    const handleIniciarEdicaoLinha = (linha: Linha) => {
        setLinhaEditando(linha.id)
        setNomeLinhaEditando(linha.nome)
    }

    const handleSalvarEdicaoLinha = async (linhaId: number) => {
        if (!nomeLinhaEditando.trim()) {
            setTituloErro('Erro!')
            setMensagemErro('Informe o nome da linha')
            setModalErroAberto(true)
            return
        }

        try {
            await atualizarLinha(linhaId, { nome: nomeLinhaEditando.trim() })
            setLinhaEditando(null)
            setNomeLinhaEditando('')
            await carregarLinhas()
            setMensagemSucesso('Linha atualizada com sucesso!')
            setModalSucessoAberto(true)
        } catch (e: any) {
            setTituloErro('Erro!')
            setMensagemErro(e?.message || 'Erro ao atualizar linha')
            setModalErroAberto(true)
        }
    }

    const handleCancelarEdicaoLinha = () => {
        setLinhaEditando(null)
        setNomeLinhaEditando('')
    }

    const indiceInicio = (paginaAtual - 1) * itensPorPagina
    const indiceFim = indiceInicio + itensPorPagina
    const linhasPaginaAtual = linhas.slice(indiceInicio, indiceFim)

    useEffect(() => {
        const totalPaginas = Math.ceil(linhas.length / itensPorPagina)
        if (paginaAtual > totalPaginas && totalPaginas > 0) {
            setPaginaAtual(totalPaginas)
        }
    }, [linhas.length, itensPorPagina, paginaAtual])

    return (
        <div className="flex min-h-screen bg-gray-50">
            <MenuLateral />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 p-6 pt-32 pb-20 md:pb-24 md:pl-20 transition-all duration-300">
                    <div className="max-w-[95%] mx-auto">
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="flex border-b border-gray-200">
                                <button
                                    onClick={() => setAbaAtiva('cadastrar')}
                                    className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                                        abaAtiva === 'cadastrar'
                                            ? 'text-white border-b-2'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                    style={abaAtiva === 'cadastrar' ? { backgroundColor: 'var(--bg-azul)' } : {}}
                                >
                                    <i className="bi bi-diagram-3 mr-2"></i>
                                    Cadastrar
                                </button>
                                <button
                                    onClick={() => setAbaAtiva('listar')}
                                    className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                                        abaAtiva === 'listar'
                                            ? 'text-white border-b-2'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                    style={abaAtiva === 'listar' ? { backgroundColor: 'var(--bg-azul)' } : {}}
                                >
                                    <i className="bi bi-list-ul mr-2"></i>
                                    Listar
                                </button>
                            </div>

                            <div className="p-6">
                                {abaAtiva === 'cadastrar' && (
                                    <form onSubmit={handleCadastrarComposto}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Nome da Linha
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    required
                                                    placeholder="Ex: Linha 1"
                                                    value={nomeLinha}
                                                    onChange={(e) => setNomeLinha(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Nome da Sublinha
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    required
                                                    placeholder="Ex: Sublinha A"
                                                    value={nomeSublinha}
                                                    onChange={(e) => setNomeSublinha(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-3 mt-4">
                                            <button 
                                                type="submit"
                                                className="flex items-center gap-2 px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                                                style={{ backgroundColor: 'var(--bg-azul)' }}
                                                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                            >
                                                <i className="bi bi-plus-circle-fill"></i>
                                                <span>Cadastrar</span>
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {abaAtiva === 'listar' && (
                                    <div>
                                        <div className="px-4 py-2 bg-blue-50 rounded-md mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className="w-8" />
                                                <div className="grid grid-cols-3 items-center w-full gap-4">
                                                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide col-span-1">
                                                        Linha
                                                    </span>
                                                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide text-center col-span-1">
                                                        Sublinha
                                                    </span>
                                                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide text-right pr-8 col-span-1">
                                                        Data Criação
                                                    </span>
                                                </div>
                                                <div className="w-24" />
                                            </div>
                                        </div>

                                        {linhas.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-12">
                                                <i className="bi bi-inbox text-gray-300 text-5xl mb-4"></i>
                                                <p className="text-gray-500 text-lg font-medium">
                                                    Nenhuma linha cadastrada
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {linhasPaginaAtual.map((linha) => {
                                                    const estaEditandoLinha = linhaEditando === linha.id
                                                    return (
                                                        <div key={linha.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-md px-4 py-3 hover:bg-gray-50 transition-colors">
                                                            <div className="flex items-center gap-3 w-full">
                                                                <span className="w-8 text-gray-400">
                                                                    <i className="bi bi-diagram-3"></i>
                                                                </span>
                                                                <div className="grid grid-cols-3 items-center w-full gap-4">
                                                                    <div className="col-span-1">
                                                                        {estaEditandoLinha ? (
                                                                            <input
                                                                                type="text"
                                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                                value={nomeLinhaEditando}
                                                                                onChange={(e) => setNomeLinhaEditando(e.target.value)}
                                                                            />
                                                                        ) : (
                                                                            <span className="text-sm font-medium text-gray-900">{linha.nome}</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="col-span-1 text-center">
                                                                        <span className="text-sm text-gray-700">
                                                                            {Array.isArray(linha.sublinhas) && linha.sublinhas.length > 0 ? linha.sublinhas[0].nome : '-'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="col-span-1 text-right pr-8">
                                                                        <span className="text-sm text-gray-700">
                                                                            {linha.data_criacao ? new Date(linha.data_criacao).toLocaleDateString('pt-BR') : '-'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 w-24 justify-end">
                                                                {estaEditandoLinha ? (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleSalvarEdicaoLinha(linha.id)}
                                                                            className="p-2 rounded transition-colors hover:opacity-80"
                                                                            style={{ color: 'var(--bg-azul)' }}
                                                                            title="Salvar"
                                                                        >
                                                                            <i className="bi bi-check-lg"></i>
                                                                        </button>
                                                                        <button
                                                                            onClick={handleCancelarEdicaoLinha}
                                                                            className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 p-2 rounded transition-colors"
                                                                            title="Cancelar"
                                                                        >
                                                                            <i className="bi bi-x-circle"></i>
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleIniciarEdicaoLinha(linha)}
                                                                            className="p-2 rounded transition-colors hover:opacity-80"
                                                                            style={{ color: 'var(--bg-azul)' }}
                                                                            title="Editar linha"
                                                                        >
                                                                            <i className="bi bi-pencil"></i>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleExcluirLinha(linha.id)}
                                                                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors"
                                                                            title="Excluir linha"
                                                                        >
                                                                            <i className="bi bi-trash"></i>
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                })}

                                                {linhas.length > itensPorPagina && (
                                                    <Paginacao
                                                        totalItens={linhas.length}
                                                        itensPorPagina={itensPorPagina}
                                                        paginaAtual={paginaAtual}
                                                        onPageChange={setPaginaAtual}
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ModalSucesso
                isOpen={modalSucessoAberto}
                onClose={() => setModalSucessoAberto(false)}
                mensagem={mensagemSucesso}
                titulo="Sucesso!"
            />

            <ModalErro
                isOpen={modalErroAberto}
                onClose={() => setModalErroAberto(false)}
                mensagem={mensagemErro}
                titulo={tituloErro}
            />

            <ModalConfirmacao
                isOpen={modalConfirmacaoLinhaAberto}
                onClose={() => {
                    setModalConfirmacaoLinhaAberto(false)
                    setLinhaIdParaExcluir(null)
                }}
                onConfirm={confirmarExcluirLinha}
                titulo="Confirmar Exclusão"
                mensagem="Tem certeza que deseja excluir esta linha? Todas as sublinhas associadas também serão excluídas."
                textoConfirmar="Excluir"
                textoCancelar="Cancelar"
                corHeader="vermelho"
            />

        </div>
    )
}

export default Linhas
