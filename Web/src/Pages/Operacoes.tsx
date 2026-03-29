import { Fragment, useState, useEffect, useRef, useMemo } from 'react'
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'
import { Paginacao } from '../Components/Compartilhados/paginacao'
import ModalSucesso from '../Components/Modais/ModalSucesso'
import ModalErro from '../Components/Modais/ModalErro'
import ModalConfirmacao from '../Components/Compartilhados/ModalConfirmacao'
import ModalEditarOperacao from '../Components/Operacoes/ModalEditarOperacao'
import { listarProdutos } from '../services/produtos'
import { listarModelos } from '../services/modelos'
import { listarSublinhas } from '../services/linhas'
import { listarPostos } from '../services/postos'
import { listarDispositivos } from '../services/dispositivos'
import { listarPecas } from '../services/pecas'
import {
    listarOperacoes as listarOperacoesAPI,
    criarOperacao,
    atualizarOperacao,
    deletarOperacao,
    adicionarPecaOperacao,
    removerPecaOperacao,
} from '../services/operacoes'


interface Operacao {
    id: number
    operacao: string
    produto: string
    modelo: string
    linha: string
    posto: string
    toten: string
    pecas: string[]
    produto_id?: number
    modelo_id?: number
    sublinha_id?: number
    posto_id?: number
    dispositivo_id?: number
    peca_ids?: number[]
    data_criacao?: string
}

interface Produto {
    id: number
    nome: string
}

interface Modelo {
    id: number
    nome: string
    produto_id?: number
}

interface Sublinha {
    id: number
    linha_id: number
    nome: string
    linha_nome?: string
}

interface LinhaComSublinha {
    linha_id: number
    linha_nome: string
    sublinha_id: number
    sublinha_nome: string
    display: string
}

interface Peca {
    id: number
    codigo: string
    nome: string
    modelo_id?: number
}

interface Posto {
    id: number
    nome: string
    sublinha_id: number
    dispositivo_id?: number
}

interface Dispositivo {
    id: number
    nome: string
    serial_number: string
}


const Operacoes = () => {
    const [abaAtiva, setAbaAtiva] = useState<'cadastrar' | 'listar'>('cadastrar')
    const [operacoes, setOperacoes] = useState<Operacao[]>([])
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [itensPorPagina] = useState(10)
    const [carregando, setCarregando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)
    const [modalSucessoAberto, setModalSucessoAberto] = useState(false)
    const [modalErroAberto, setModalErroAberto] = useState(false)
    const [mensagemSucesso, setMensagemSucesso] = useState('')
    const [mensagemErro, setMensagemErro] = useState('')
    const [tituloErro, setTituloErro] = useState('Erro!')
    const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false)
    const [operacaoParaRemover, setOperacaoParaRemover] = useState<Operacao | null>(null)
    const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false)
    const [operacaoEditando, setOperacaoEditando] = useState<Operacao | null>(null)
    const [filtroOperacao, setFiltroOperacao] = useState('')
    const [filtroProduto, setFiltroProduto] = useState('')
    const [filtroPosto, setFiltroPosto] = useState('')
    const [operacaoExpandida, setOperacaoExpandida] = useState<number | null>(null)

    const [operacao, setOperacao] = useState('')
    const [produto, setProduto] = useState(0)
    const [modelo, setModelo] = useState(0)
    const [linha, setLinha] = useState('')
    const [posto, setPosto] = useState(0)
    const [toten, setToten] = useState('')
    const [pecas, setPecas] = useState<string[]>([])
    const [pecaTemp, setPecaTemp] = useState('')
    
    // Ref para controlar se estamos carregando dados de edição (evita limpar peças no useEffect)
    const isLoadingEditData = useRef(false)
    const previousProdutoRef = useRef(0)

    // Dados para os dropdowns
    const [produtos, setProdutos] = useState<Produto[]>([])
    const [todosModelos, setTodosModelos] = useState<Modelo[]>([]) // Todos os modelos carregados
    const [modelos, setModelos] = useState<Modelo[]>([]) // Modelos filtrados por produto
    const [linhasComSublinhas, setLinhasComSublinhas] = useState<LinhaComSublinha[]>([])
    const [postos, setPostos] = useState<Posto[]>([])
    const [sublinhas, setSublinhas] = useState<Sublinha[]>([])
    const [dispositivos, setDispositivos] = useState<Dispositivo[]>([])
    const [todasPecas, setTodasPecas] = useState<Peca[]>([])
    const [pecasDisponiveis, setPecasDisponiveis] = useState<Peca[]>([])

    // Carregar dados ao montar o componente
    useEffect(() => {
        if (!produtos.length || !todosModelos.length || !postos.length || !linhasComSublinhas.length) {
            carregarDadosDropdowns()
        }
        if (abaAtiva === 'listar') {
            carregarOperacoes()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [abaAtiva])

    // Filtrar modelos quando produto mudar
    useEffect(() => {
        const produtoAlterou = previousProdutoRef.current !== produto

        if (produto) {
            const modelosFiltrados = todosModelos.filter(m => m.produto_id === produto)
            setModelos(modelosFiltrados)
            // Limpar modelo somente quando o produto realmente mudou
            if (produtoAlterou && !isLoadingEditData.current) {
                setModelo(0)
            }
        } else {
            setModelos([])
            if (produtoAlterou && !isLoadingEditData.current) {
                setModelo(0)
            }
        }

        previousProdutoRef.current = produto
    }, [produto, produtos, todosModelos])

    // Carregar peças quando modelo mudar
    useEffect(() => {
        if (modelo) {
            carregarPecasPorModelo()
            // Limpar peças selecionadas quando modelo mudar, mas não se estiver carregando dados de edição
            if (!isLoadingEditData.current) {
                setPecas([])
                setPecaTemp('')
            }
        } else {
            setPecasDisponiveis([])
            if (!isLoadingEditData.current) {
                setPecas([])
                setPecaTemp('')
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modelo])

    // Ao escolher posto, preencher linha e totem automaticamente
    useEffect(() => {
        if (posto && !isLoadingEditData.current) {
            const postoSelecionado = postos.find(p => p.id === posto)
            if (!postoSelecionado) {
                setLinha('')
                setToten('')
                return
            }

            const sublinhaSelecionada = sublinhas.find(s => s.id === postoSelecionado.sublinha_id)
            if (sublinhaSelecionada) {
                const linhaDisplay = sublinhaSelecionada.linha_nome
                    ? `${sublinhaSelecionada.linha_nome} - ${sublinhaSelecionada.nome}`
                    : sublinhaSelecionada.nome
                setLinha(linhaDisplay)
            } else {
                setLinha('')
            }

            if (postoSelecionado.dispositivo_id) {
                const dispositivoSelecionado = dispositivos.find(d => d.id === postoSelecionado.dispositivo_id)
                setToten(dispositivoSelecionado?.serial_number || '')
            } else {
                setToten('')
            }
        } else if (!posto && !isLoadingEditData.current) {
            setLinha('')
            setToten('')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [posto, postos, sublinhas, dispositivos])

    const carregarDadosDropdowns = async () => {
        try {
            const [produtosResp, modelosResp, sublinhasResp, postosResp, dispositivosResp, pecasResp] = await Promise.all([
                listarProdutos(),
                listarModelos(),
                listarSublinhas(),
                listarPostos(),
                listarDispositivos(),
                listarPecas(),
            ])

            const linhasMapeadas: LinhaComSublinha[] = sublinhasResp.map((s) => ({
                linha_id: s.linha_id,
                linha_nome: s.linha_nome || '',
                sublinha_id: s.id,
                sublinha_nome: s.nome,
                display: s.linha_nome ? `${s.linha_nome} - ${s.nome}` : s.nome,
            }))

            setProdutos(produtosResp)
            setTodosModelos(modelosResp)
            setModelos(produto ? modelosResp.filter(m => m.produto_id === produto) : [])
            setSublinhas(sublinhasResp)
            setLinhasComSublinhas(linhasMapeadas)
            setTodasPecas(pecasResp)
            setPostos(postosResp.map((p) => ({
                id: p.id,
                nome: p.nome,
                sublinha_id: p.sublinha_id,
                dispositivo_id: p.dispositivo_id,
            })))
            setDispositivos(dispositivosResp.map((d) => ({
                id: d.id,
                nome: d.nome,
                serial_number: d.serial_number,
            })))
        } catch {
            setProdutos([])
            setTodosModelos([])
            setModelos([])
            setSublinhas([])
            setLinhasComSublinhas([])
            setTodasPecas([])
            setPostos([])
            setDispositivos([])
        }
    }

    const carregarLinhasComSublinhas = async () => {
        try {
            const sublinhasResp = await listarSublinhas()
            setSublinhas(sublinhasResp)
            setLinhasComSublinhas(sublinhasResp.map((s) => ({
                linha_id: s.linha_id,
                linha_nome: s.linha_nome || '',
                sublinha_id: s.id,
                sublinha_nome: s.nome,
                display: s.linha_nome ? `${s.linha_nome} - ${s.nome}` : s.nome,
            })))
        } catch {
            setSublinhas([])
            setLinhasComSublinhas([])
        }
    }

    const carregarPecasPorModelo = async (modeloId?: number) => {
        const idModelo = modeloId || modelo
        if (!idModelo) {
            setPecasDisponiveis([])
            return
        }

        setPecasDisponiveis(todasPecas.filter((p) => p.modelo_id === idModelo))
    }

    const carregarOperacoes = async () => {
        try {
            setCarregando(true)
            setErro(null)

            const dados = await listarOperacoesAPI()

            const produtosPorId = new Map(produtos.map((p) => [p.id, p.nome]))
            const modelosPorId = new Map(todosModelos.map((m) => [m.id, m.nome]))
            const postosPorId = new Map(postos.map((p) => [p.id, p]))
            const sublinhasPorId = new Map(sublinhas.map((s) => [s.id, s]))
            const dispositivosPorId = new Map(dispositivos.map((d) => [d.id, d.serial_number]))

            const operacoesMapeadas: Operacao[] = dados.map((op) => {
                const postoDaOperacao = postosPorId.get(op.posto_id)
                const sublinhaDaOperacao = postoDaOperacao ? sublinhasPorId.get(postoDaOperacao.sublinha_id) : undefined
                const linhaDisplay = sublinhaDaOperacao
                    ? (sublinhaDaOperacao.linha_nome
                        ? `${sublinhaDaOperacao.linha_nome} - ${sublinhaDaOperacao.nome}`
                        : sublinhaDaOperacao.nome)
                    : 'Não informada'

                return {
                    id: op.id,
                    operacao: op.nome,
                    produto: produtosPorId.get(op.produto_id) || `Produto ${op.produto_id}`,
                    modelo: modelosPorId.get(op.modelo_id) || `Modelo ${op.modelo_id}`,
                    linha: linhaDisplay,
                    posto: postoDaOperacao?.nome || `Posto ${op.posto_id}`,
                    toten: op.dispositivo_id ? (dispositivosPorId.get(op.dispositivo_id) || `Totem ${op.dispositivo_id}`) : '',
                    pecas: Array.isArray(op.pecas) ? op.pecas.map((peca) => `${peca.nome} - ${peca.codigo}`) : [],
                    produto_id: op.produto_id,
                    modelo_id: op.modelo_id,
                    sublinha_id: op.sublinha_id,
                    posto_id: op.posto_id,
                    dispositivo_id: op.dispositivo_id || undefined,
                    peca_ids: Array.isArray(op.pecas) ? op.pecas.map((peca) => peca.id) : [],
                    data_criacao: op.data_criacao,
                }
            })

            setOperacoes(operacoesMapeadas)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar operações'
            setErro(errorMessage)
            setOperacoes([])
        } finally {
            setCarregando(false)
        }
    }


    const adicionarPeca = () => {
        if (!pecaTemp.trim()) return
        
        // pecaTemp está no formato "nome|codigo"
        const [nome, codigo] = pecaTemp.split('|')
        if (!nome || !codigo) return
        
        const display = `${nome} - ${codigo}`
        
        // Verificar se já existe (comparar pelo display completo)
        if (pecas.includes(display)) return
        
        setPecas([...pecas, display])
        setPecaTemp('')
    }

    const removerPeca = (index: number) => {
        setPecas(pecas.filter((_, i) => i !== index))
    }

    const limparFormulario = () => {
        isLoadingEditData.current = false
        setOperacao('')
        setProduto(0)
        setModelo(0)
        setLinha('')
        setPosto(0)
        setToten('')
        setPecas([])
        setPecaTemp('')
    }

    const obterIdsPecasSelecionadas = (pecasSelecionadas: string[]) => {
        return pecasSelecionadas
            .map((pecaDisplay) => todasPecas.find((peca) => `${peca.nome} - ${peca.codigo}` === pecaDisplay)?.id)
            .filter((id): id is number => typeof id === 'number')
    }

    const sincronizarPecasDaOperacao = async (operacaoId: number, pecasSelecionadas: string[], pecaIdsAtuais: number[] = []) => {
        const pecaIdsSelecionadas = obterIdsPecasSelecionadas(pecasSelecionadas)

        const idsParaAdicionar = pecaIdsSelecionadas.filter((id) => !pecaIdsAtuais.includes(id))
        const idsParaRemover = pecaIdsAtuais.filter((id) => !pecaIdsSelecionadas.includes(id))

        await Promise.all(idsParaAdicionar.map((pecaId) => adicionarPecaOperacao(operacaoId, pecaId)))
        await Promise.all(idsParaRemover.map((pecaId) => removerPecaOperacao(operacaoId, pecaId)))
    }

    const salvarOperacao = async (dados: {
        operacao: string
        produto_id: number
        modelo_id: number
        posto_id: number
        pecas: string[]
    }, operacaoId?: number, pecaIdsAtuais: number[] = []) => {
        const postoSelecionado = postos.find((item) => item.id === dados.posto_id)
        if (!postoSelecionado) {
            throw new Error('Posto selecionado não encontrado')
        }

        const payload = {
            nome: dados.operacao.trim(),
            sublinha_id: postoSelecionado.sublinha_id,
            posto_id: dados.posto_id,
            produto_id: dados.produto_id,
            modelo_id: dados.modelo_id,
            dispositivo_id: postoSelecionado.dispositivo_id,
        }

        if (operacaoId) {
            await atualizarOperacao(operacaoId, payload)
            await sincronizarPecasDaOperacao(operacaoId, dados.pecas, pecaIdsAtuais)
            setMensagemSucesso('Operação atualizada com sucesso!')
            return
        }

        const operacaoCriada = await criarOperacao(payload)
        await sincronizarPecasDaOperacao(operacaoCriada.id, dados.pecas)
        setMensagemSucesso('Operação cadastrada com sucesso!')
    }

    const handleSalvar = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!operacao.trim() || !produto || !modelo || !linha || !posto) {
            setTituloErro('Erro!')
            setMensagemErro('Preencha todos os campos obrigatórios')
            setModalErroAberto(true)
            return
        }

        try {
            setErro(null)
            setCarregando(true)

            await salvarOperacao({
                operacao,
                produto_id: produto,
                modelo_id: modelo,
                posto_id: posto,
                pecas,
            })

            setModalSucessoAberto(true)

            limparFormulario()
            await carregarOperacoes()
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar operação'
            setErro(errorMessage)
            setTituloErro('Erro!')
            setMensagemErro(`Erro: ${errorMessage}`)
            setModalErroAberto(true)
        } finally {
            setCarregando(false)
        }
    }

    const abrirModalRemover = (op: Operacao) => {
        setOperacaoParaRemover(op)
        setModalConfirmacaoAberto(true)
    }

    const handleRemoverOperacao = async () => {
        if (!operacaoParaRemover) return

        try {
            await deletarOperacao(operacaoParaRemover.id)
            setModalConfirmacaoAberto(false)
            setOperacaoParaRemover(null)
            setMensagemSucesso('Operação removida com sucesso!')
            setModalSucessoAberto(true)
            await carregarOperacoes()
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro ao remover operação'
            setModalConfirmacaoAberto(false)
            setOperacaoParaRemover(null)
            setTituloErro('Erro!')
            setMensagemErro(errorMessage)
            setModalErroAberto(true)
        }
    }

    const handleEditarOperacao = async (op: Operacao) => {
        if (!produtos.length || !todosModelos.length || !postos.length) {
            await carregarDadosDropdowns()
        }
        if (linhasComSublinhas.length === 0) {
            await carregarLinhasComSublinhas()
        }

        setOperacaoEditando(op)
        setModalEdicaoAberto(true)
    }

    const handleSalvarEdicaoModal = async (dados: {
        operacao: string
        produto_id: number
        modelo_id: number
        posto_id: number
        pecas: string[]
    }) => {
        if (!operacaoEditando) return

        try {
            await salvarOperacao(dados, operacaoEditando.id, operacaoEditando.peca_ids || [])
            setModalEdicaoAberto(false)
            setOperacaoEditando(null)
            setModalSucessoAberto(true)
            await carregarOperacoes()
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar operação'
            setTituloErro('Erro!')
            setMensagemErro(errorMessage)
            setModalErroAberto(true)
            throw error
        }
    }

    const formatarData = (valor?: string) => {
        if (!valor) return '-'
        return new Date(valor).toLocaleDateString('pt-BR')
    }

    const operacoesFiltradas = useMemo(() => {
        return operacoes.filter((item) => {
            const condOperacao = !filtroOperacao || item.operacao.toLowerCase().includes(filtroOperacao.toLowerCase())
            const condProduto = !filtroProduto || item.produto.toLowerCase().includes(filtroProduto.toLowerCase())
            const condPosto = !filtroPosto || item.posto.toLowerCase().includes(filtroPosto.toLowerCase())
            return condOperacao && condProduto && condPosto
        })
    }, [operacoes, filtroOperacao, filtroProduto, filtroPosto])

    const indiceInicio = (paginaAtual - 1) * itensPorPagina
    const indiceFim = indiceInicio + itensPorPagina
    const operacoesPaginaAtual = operacoesFiltradas.slice(indiceInicio, indiceFim)

    const temFiltros = Boolean(filtroOperacao || filtroProduto || filtroPosto)

    const limparFiltros = () => {
        setFiltroOperacao('')
        setFiltroProduto('')
        setFiltroPosto('')
    }

    const toggleExpandirOperacao = (operacaoId: number) => {
        setOperacaoExpandida((atual) => (atual === operacaoId ? null : operacaoId))
    }

    useEffect(() => {
        setPaginaAtual(1)
    }, [filtroOperacao, filtroProduto, filtroPosto])

    useEffect(() => {
        const totalPaginas = Math.ceil(operacoesFiltradas.length / itensPorPagina)
        if (paginaAtual > totalPaginas && totalPaginas > 0) {
            setPaginaAtual(totalPaginas)
        }
    }, [operacoesFiltradas.length, itensPorPagina, paginaAtual])

    return (
        <div className="flex min-h-screen bg-gray-50">
            <MenuLateral />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 p-6 pt-32 pb-20 md:pb-24 md:pl-20 transition-all duration-300">
                    <div className="max-w-[95%] mx-auto">
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="flex border-b border-gray-200 bg-white">
                                <button
                                    onClick={() => setAbaAtiva('cadastrar')}
                                    className={`flex-1 px-6 py-4 text-center font-medium ${
                                        abaAtiva === 'cadastrar'
                                            ? 'text-white'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                    style={abaAtiva === 'cadastrar' ? { backgroundColor: 'var(--bg-azul)' } : {}}
                                >
                                    <i className="bi bi-plus-circle-fill mr-2"></i>
                                    Cadastrar
                                </button>
                                <button
                                    onClick={() => setAbaAtiva('listar')}
                                    className={`flex-1 px-6 py-4 text-center font-medium ${
                                        abaAtiva === 'listar'
                                            ? 'text-white'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                    style={abaAtiva === 'listar' ? { backgroundColor: 'var(--bg-azul)' } : {}}
                                >
                                    <i className="bi bi-list-ul mr-2"></i>
                                    Listar
                                </button>
                            </div>

                            <div className={abaAtiva === 'cadastrar' ? 'p-6' : ''}>
                                {abaAtiva === 'cadastrar' ? (
                                    <form onSubmit={handleSalvar}>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Operação *
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Ex: Soldagem da coluna"
                                                    value={operacao}
                                                    onChange={(e) => setOperacao(e.target.value)}
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Produto *
                                                </label>
                                                <select
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={produto}
                                                    onChange={(e) => setProduto(Number(e.target.value))}
                                                    required
                                                >
                                                    <option value={0}>Selecione</option>
                                                    {produtos.map((p) => (
                                                        <option key={p.id} value={p.id}>{p.nome}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Modelo *
                                                </label>
                                                <select
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={modelo}
                                                    onChange={(e) => setModelo(Number(e.target.value))}
                                                    required
                                                >
                                                    <option value={0}>Selecione</option>
                                                    {modelos.map((m) => (
                                                        <option key={m.id} value={m.id}>{m.nome}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Posto *
                                                </label>
                                                <select
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={posto}
                                                    onChange={(e) => setPosto(Number(e.target.value))}
                                                    required
                                                >
                                                    <option value={0}>Selecione</option>
                                                    {postos.map((p) => (
                                                        <option key={p.id} value={p.id}>{p.nome}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Linha *
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700"
                                                    value={linha || 'Selecione um posto para preencher'}
                                                    readOnly
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Toten/ID
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700"
                                                    value={toten || 'Selecione um posto para preencher'}
                                                    readOnly
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Peça
                                                </label>
                                                <div className="flex gap-2">
                                                    <select
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        value={pecaTemp}
                                                        onChange={(e) => setPecaTemp(e.target.value)}
                                                        disabled={modelo === 0 || pecasDisponiveis.length === 0}
                                                    >
                                                        <option value="">
                                                            {modelo === 0 
                                                                ? 'Selecione um modelo primeiro' 
                                                                : pecasDisponiveis.length === 0 
                                                                ? 'Nenhuma peça disponível para este modelo'
                                                                : 'Selecione uma peça'}
                                                        </option>
                                                        {pecasDisponiveis.map((p) => {
                                                            const display = `${p.nome} - ${p.codigo}`
                                                            const value = `${p.nome}|${p.codigo}`
                                                            return (
                                                                <option key={p.id} value={value}>
                                                                    {display}
                                                                </option>
                                                            )
                                                        })}
                                                    </select>
                                                    <button
                                                        type="button"
                                                        onClick={adicionarPeca}
                                                        disabled={!pecaTemp.trim()}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                                    >
                                                        <i className="bi bi-plus-lg"></i>
                                                    </button>
                                                </div>
                                                {pecas.length > 0 && (
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {pecas.map((peca, index) => (
                                                            <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded text-sm">
                                                                {peca}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removerPeca(index)}
                                                                    className="text-green-600 hover:text-green-800"
                                                                >
                                                                    <i className="bi bi-x"></i>
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3 mt-6">
                                            <button
                                                type="submit"
                                                className="flex items-center gap-2 px-4 py-2 text-white rounded-md disabled:opacity-50"
                                                style={{ backgroundColor: 'var(--bg-azul)' }}
                                                disabled={!operacao.trim() || !produto || !modelo || !linha || !posto || carregando}
                                            >
                                                <i className="bi bi-plus-circle-fill"></i>
                                                <span>
                                                    {carregando ? 'Salvando...' : 'Cadastrar'}
                                                </span>
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="flex flex-col gap-6">
                                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                            <div className="p-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                                        <i className="bi bi-funnel"></i>
                                                        Filtros de Busca
                                                    </h4>
                                                    {temFiltros && (
                                                        <button
                                                            onClick={limparFiltros}
                                                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                        >
                                                            <i className="bi bi-x-circle"></i>
                                                            Limpar Filtros
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Operação</label>
                                                        <input
                                                            type="text"
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            placeholder="Buscar por operação..."
                                                            value={filtroOperacao}
                                                            onChange={(e) => setFiltroOperacao(e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Produto</label>
                                                        <input
                                                            type="text"
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            placeholder="Buscar por produto..."
                                                            value={filtroProduto}
                                                            onChange={(e) => setFiltroProduto(e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Posto</label>
                                                        <input
                                                            type="text"
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            placeholder="Buscar por posto..."
                                                            value={filtroPosto}
                                                            onChange={(e) => setFiltroPosto(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {erro && (
                                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                                {erro}
                                            </div>
                                        )}

                                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="border-b border-gray-200" style={{ backgroundColor: 'var(--bg-azul)' }}>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase w-8"></th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Operação</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Produto</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Modelo</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Linha</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Posto</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Toten</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Peças</th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase">Data Criação</th>
                                                            <th className="px-4 py-3 text-center text-xs font-medium text-white uppercase">Ações</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {!carregando && operacoesPaginaAtual.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={10} className="px-6 py-12 text-center">
                                                                    <div className="flex flex-col items-center justify-center">
                                                                        <i className="bi bi-inbox text-gray-300 text-5xl mb-4"></i>
                                                                        <p className="text-gray-500 text-lg font-medium">
                                                                            {temFiltros
                                                                                ? 'Nenhuma operação encontrada com os filtros aplicados'
                                                                                : 'Nenhuma operação cadastrada'}
                                                                        </p>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            operacoesPaginaAtual.map((op) => (
                                                                <Fragment key={op.id}>
                                                                    <tr className="hover:bg-gray-50">
                                                                        <td className="px-4 py-4">
                                                                            <button
                                                                                onClick={() => toggleExpandirOperacao(op.id)}
                                                                                className="text-gray-600 hover:text-gray-800"
                                                                                title="Mostrar peças"
                                                                            >
                                                                                <i className={`bi ${operacaoExpandida === op.id ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
                                                                            </button>
                                                                        </td>
                                                                        <td className="px-4 py-4 text-sm font-medium text-gray-900">{op.operacao}</td>
                                                                        <td className="px-4 py-4 text-sm text-gray-900">{op.produto}</td>
                                                                        <td className="px-4 py-4 text-sm text-gray-900">{op.modelo}</td>
                                                                        <td className="px-4 py-4 text-sm text-gray-900">{op.linha}</td>
                                                                        <td className="px-4 py-4 text-sm text-gray-900">{op.posto}</td>
                                                                        <td className="px-4 py-4 text-sm text-gray-900">{op.toten || '-'}</td>
                                                                        <td className="px-4 py-4 text-sm text-gray-900">{op.pecas.length} peça(s)</td>
                                                                        <td className="px-4 py-4 text-sm text-gray-900">{formatarData(op.data_criacao)}</td>
                                                                        <td className="px-4 py-4 text-sm text-center">
                                                                            <div className="flex items-center justify-center gap-2">
                                                                                <button
                                                                                    onClick={() => handleEditarOperacao(op)}
                                                                                    className="text-blue-600 hover:text-blue-800 transition-colors"
                                                                                    title="Editar operação"
                                                                                >
                                                                                    <i className="bi bi-pencil-square"></i>
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => abrirModalRemover(op)}
                                                                                    className="text-red-600 hover:text-red-800 transition-colors"
                                                                                    title="Remover operação"
                                                                                >
                                                                                    <i className="bi bi-trash"></i>
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                    {operacaoExpandida === op.id && (
                                                                        <tr>
                                                                            <td colSpan={10} className="px-6 py-4 bg-gray-50">
                                                                                <div className="ml-8">
                                                                                    {op.pecas.length > 0 ? (
                                                                                        <ul className="space-y-1 text-sm text-gray-700">
                                                                                            {op.pecas.map((peca, idx) => (
                                                                                                <li key={idx}>{peca}</li>
                                                                                            ))}
                                                                                        </ul>
                                                                                    ) : (
                                                                                        <p className="text-sm text-gray-500">Nenhuma peça vinculada.</p>
                                                                                    )}
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </Fragment>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {!carregando && operacoesFiltradas.length > itensPorPagina && (
                                            <Paginacao
                                                totalItens={operacoesFiltradas.length}
                                                itensPorPagina={itensPorPagina}
                                                paginaAtual={paginaAtual}
                                                onPageChange={setPaginaAtual}
                                            />
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

            <ModalEditarOperacao
                isOpen={modalEdicaoAberto}
                onClose={() => {
                    setModalEdicaoAberto(false)
                    setOperacaoEditando(null)
                }}
                onSave={handleSalvarEdicaoModal}
                operacaoEditando={operacaoEditando}
                produtos={produtos}
                todosModelos={todosModelos}
                postos={postos}
                sublinhas={sublinhas}
                dispositivos={dispositivos}
                todasPecas={todasPecas}
            />

            <ModalConfirmacao
                isOpen={modalConfirmacaoAberto}
                onClose={() => {
                    setModalConfirmacaoAberto(false)
                    setOperacaoParaRemover(null)
                }}
                onConfirm={handleRemoverOperacao}
                titulo="Remover Operação"
                mensagem="Tem certeza que deseja remover esta operação?"
                textoConfirmar="Remover"
                textoCancelar="Cancelar"
                corHeader="vermelho"
            />
        </div>
    )
}

export default Operacoes
