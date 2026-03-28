import { useState, useEffect } from 'react'
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'
import { Paginacao } from '../Components/Compartilhados/paginacao'
import CardLinha from '../Components/Linhas/CardLinha'
import ModalSucesso from '../Components/Modais/ModalSucesso'
import ModalErro from '../Components/Modais/ModalErro'
import ModalConfirmacao from '../Components/Compartilhados/ModalConfirmacao'
import { listarLinhas, atualizarLinha, deletarLinha, atualizarSublinha, deletarSublinha, criarLinhaComSublinha } from '../services/linhas'


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
    const [linhaExpandida, setLinhaExpandida] = useState<number | null>(null)
    const [linhaEditando, setLinhaEditando] = useState<number | null>(null)
    const [nomeLinhaEditando, setNomeLinhaEditando] = useState('')
    const [sublinhaEditando, setSublinhaEditando] = useState<number | null>(null)
    const [nomeSublinhaEditando, setNomeSublinhaEditando] = useState('')
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [itensPorPagina] = useState(10)
    const [modalSucessoAberto, setModalSucessoAberto] = useState(false)
    const [modalErroAberto, setModalErroAberto] = useState(false)
    const [mensagemSucesso, setMensagemSucesso] = useState('')
    const [mensagemErro, setMensagemErro] = useState('')
    const [tituloErro, setTituloErro] = useState('Erro!')
    const [modalConfirmacaoLinhaAberto, setModalConfirmacaoLinhaAberto] = useState(false)
    const [modalConfirmacaoSublinhaAberto, setModalConfirmacaoSublinhaAberto] = useState(false)
    const [linhaIdParaExcluir, setLinhaIdParaExcluir] = useState<number | null>(null)
    const [sublinhaIdParaExcluir, setSublinhaIdParaExcluir] = useState<number | null>(null)

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

    const handleExcluirSublinha = (sublinhaId: number) => {
        setSublinhaIdParaExcluir(sublinhaId)
        setModalConfirmacaoSublinhaAberto(true)
    }

    const confirmarExcluirSublinha = async () => {
        if (!sublinhaIdParaExcluir) return

        try {
            await deletarSublinha(sublinhaIdParaExcluir)
            setModalConfirmacaoSublinhaAberto(false)
            setSublinhaIdParaExcluir(null)
            await carregarLinhas()
            setMensagemSucesso('Sublinha excluída com sucesso!')
            setModalSucessoAberto(true)
        } catch (e: any) {
            setModalConfirmacaoSublinhaAberto(false)
            setSublinhaIdParaExcluir(null)
            setTituloErro('Erro!')
            setMensagemErro(e?.message || 'Erro ao excluir sublinha')
            setModalErroAberto(true)
        }
    }

    const handleIniciarEdicaoLinha = (linha: Linha) => {
        setLinhaEditando(linha.id)
        setNomeLinhaEditando(linha.nome)
        setSublinhaEditando(null)
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

    const handleIniciarEdicaoSublinha = (sublinha: Sublinha) => {
        setSublinhaEditando(sublinha.id)
        setNomeSublinhaEditando(sublinha.nome)
        setLinhaEditando(null)
    }

    const handleSalvarEdicaoSublinha = async (sublinha: Sublinha) => {
        if (!nomeSublinhaEditando.trim()) {
            setTituloErro('Erro!')
            setMensagemErro('Informe o nome da sublinha')
            setModalErroAberto(true)
            return
        }

        try {
            await atualizarSublinha(sublinha.id, { nome: nomeSublinhaEditando.trim(), linha_id: sublinha.linha_id })
            setSublinhaEditando(null)
            setNomeSublinhaEditando('')
            await carregarLinhas()
            setMensagemSucesso('Sublinha atualizada com sucesso!')
            setModalSucessoAberto(true)
        } catch (e: any) {
            setTituloErro('Erro!')
            setMensagemErro(e?.message || 'Erro ao atualizar sublinha')
            setModalErroAberto(true)
        }
    }

    const handleCancelarEdicaoSublinha = () => {
        setSublinhaEditando(null)
        setNomeSublinhaEditando('')
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
                                        <div className="px-4 py-2 bg-gray-50 rounded-md">
                                            <div className="flex items-center gap-3">
                                                <span className="w-8" />
                                                <div className="grid grid-cols-3 items-center w-full gap-4">
                                                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide col-span-1">
                                                        Linha
                                                    </span>
                                                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide text-center col-span-1">
                                                        Data
                                                    </span>
                                                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide text-right pr-8 col-span-1">
                                                        Qtd sublinha
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
                                            <div className="space-y-4 mt-2">
                                                {linhasPaginaAtual.map((linha) => {
                                                    const estaExpandida = linhaExpandida === linha.id
                                                    const estaEditandoLinha = linhaEditando === linha.id
                                                    return (
                                                        <CardLinha
                                                            key={linha.id}
                                                            linha={linha}
                                                            estaExpandida={estaExpandida}
                                                            estaEditandoLinha={estaEditandoLinha}
                                                            nomeLinhaEditando={nomeLinhaEditando}
                                                            sublinhaEditando={sublinhaEditando}
                                                            nomeSublinhaEditando={nomeSublinhaEditando}
                                                            onToggleExpandir={() => setLinhaExpandida(estaExpandida ? null : linha.id)}
                                                            onIniciarEdicaoLinha={() => handleIniciarEdicaoLinha(linha)}
                                                            onSalvarEdicaoLinha={() => handleSalvarEdicaoLinha(linha.id)}
                                                            onCancelarEdicaoLinha={handleCancelarEdicaoLinha}
                                                            onNomeLinhaEditandoChange={setNomeLinhaEditando}
                                                            onExcluirLinha={() => handleExcluirLinha(linha.id)}
                                                            onIniciarEdicaoSublinha={handleIniciarEdicaoSublinha}
                                                            onSalvarEdicaoSublinha={handleSalvarEdicaoSublinha}
                                                            onCancelarEdicaoSublinha={handleCancelarEdicaoSublinha}
                                                            onNomeSublinhaEditandoChange={setNomeSublinhaEditando}
                                                            onExcluirSublinha={handleExcluirSublinha}
                                                        />
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

            <ModalConfirmacao
                isOpen={modalConfirmacaoSublinhaAberto}
                onClose={() => {
                    setModalConfirmacaoSublinhaAberto(false)
                    setSublinhaIdParaExcluir(null)
                }}
                onConfirm={confirmarExcluirSublinha}
                titulo="Confirmar Exclusão"
                mensagem="Tem certeza que deseja excluir esta sublinha?"
                textoConfirmar="Excluir"
                textoCancelar="Cancelar"
                corHeader="vermelho"
            />
        </div>
    )
}

export default Linhas
