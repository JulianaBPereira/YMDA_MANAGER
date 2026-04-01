import { useState, useEffect, useMemo, useRef } from 'react'
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'
import { Paginacao } from '../Components/Compartilhados/paginacao'
import ModalFormulario from '../Components/Compartilhados/ModalFormulario'
import ModalConfirmacao from '../Components/Compartilhados/ModalConfirmacao'
import ModalSucesso from '../Components/Modais/ModalSucesso'
import { listarProdutos, atualizarProduto, deletarProduto, type Produto as ProdutoApi } from '../services/produtos'
import { listarModelos, atualizarModelo, deletarModelo, type Modelo as ModeloApi } from '../services/modelos'


interface Modelo {
    id: number
    nome: string
    codigo?: string
    produto_id?: number
    data_criacao?: string
}

interface Produto {
    id: number
    nome: string
    data_criacao?: string
    modelos?: Modelo[]
}

let produtosCache: Produto[] | null = null
let modelosCache: Modelo[] | null = null

const ListagemProdutosModelos = () => {
    const [produtos, setProdutos] = useState<Produto[]>(() => produtosCache ?? [])
    const [modelos, setModelos] = useState<Modelo[]>(() => modelosCache ?? [])
    const [filtroProduto, setFiltroProduto] = useState('')
    const [filtroModelo, setFiltroModelo] = useState('')
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [erro, setErro] = useState<string | null>(null)
    const [carregando, setCarregando] = useState(() => produtosCache === null || modelosCache === null)
    const [modalEdicaoProdutoAberto, setModalEdicaoProdutoAberto] = useState(false)
    const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null)
    const [modalEdicaoModeloAberto, setModalEdicaoModeloAberto] = useState(false)
    const [modeloEditando, setModeloEditando] = useState<Modelo | null>(null)
    const [modalConfirmacao, setModalConfirmacao] = useState(false)
    const [itemParaDeletar, setItemParaDeletar] = useState<{ tipo: 'produto' | 'modelo'; item: Produto | Modelo } | null>(null)
    const [modalErroDuplicado, setModalErroDuplicado] = useState(false)
    const [mensagemErroDuplicado, setMensagemErroDuplicado] = useState('')
    const [modalSucessoAberto, setModalSucessoAberto] = useState(false)
    const [mensagemSucesso, setMensagemSucesso] = useState('')
    const [produtoExpandido, setProdutoExpandido] = useState<number | null>(null)
    const carregamentoInicialExecutadoRef = useRef(false)

    const itensPorPagina = 10

    useEffect(() => {
        if (carregamentoInicialExecutadoRef.current) return
        carregamentoInicialExecutadoRef.current = true
        carregarDados()
    }, [])

    const carregarDados = async () => {
        try {
            setCarregando(produtosCache === null || modelosCache === null)
            setErro(null)

            const [produtosResp, modelosResp] = await Promise.all([
                listarProdutos(),
                listarModelos(),
            ])

            const produtosOrdenados = [...(produtosResp as ProdutoApi[])].sort((a, b) => b.id - a.id)
            const modelosOrdenados = [...(modelosResp as ModeloApi[])].sort((a, b) => b.id - a.id)

            // Agrupar modelos por produto_id
            const modelosPorProduto = new Map<number, Modelo[]>()
            for (const m of modelosOrdenados) {
                if (!m.produto_id) continue
                const arr = modelosPorProduto.get(m.produto_id) ?? []
                arr.push({ id: m.id, nome: m.nome, produto_id: m.produto_id, data_criacao: m.data_criacao })
                modelosPorProduto.set(m.produto_id, arr)
            }

            const produtosComModelos: Produto[] = produtosOrdenados.map(p => ({
                id: p.id,
                nome: p.nome,
                data_criacao: p.data_criacao,
                modelos: modelosPorProduto.get(p.id) ?? [],
            }))

            produtosCache = produtosComModelos
            modelosCache = modelosOrdenados as Modelo[]
            setProdutos(produtosComModelos)
            setModelos(modelosOrdenados as Modelo[])
        } catch (err) {
            setErro(err instanceof Error ? err.message : 'Erro ao carregar dados')
        } finally {
            setCarregando(false)
        }
    }

    const produtosFiltrados = useMemo(() => {
        return produtos.filter(produto => {
            const matchProduto = !filtroProduto || produto.nome.toLowerCase().includes(filtroProduto.toLowerCase())
            
            if (!matchProduto) return false
            
            if (filtroModelo) {
                const temModeloMatch = produto.modelos?.some(modelo => 
                    modelo.nome.toLowerCase().includes(filtroModelo.toLowerCase())
                )
                return temModeloMatch || false
            }
            
            return true
        })
    }, [produtos, filtroProduto, filtroModelo])

    const indiceInicio = (paginaAtual - 1) * itensPorPagina
    const produtosPaginaAtual = produtosFiltrados.slice(indiceInicio, indiceInicio + itensPorPagina)

    useEffect(() => {
        setPaginaAtual(1)
    }, [filtroProduto, filtroModelo])

    useEffect(() => {
        const totalPaginas = Math.ceil(produtosFiltrados.length / itensPorPagina)
        if (paginaAtual > totalPaginas && totalPaginas > 0) {
            setPaginaAtual(totalPaginas)
        }
    }, [produtosFiltrados.length, paginaAtual])

    const limparFiltros = () => {
        setFiltroProduto('')
        setFiltroModelo('')
    }

    const formatarData = (data: string | undefined) => {
        if (!data) return '-'
        try {
            const date = new Date(data)
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            })
        } catch {
            return data
        }
    }

    const handleEditarProduto = (produto: Produto) => {
        setProdutoEditando(produto)
        setModalEdicaoProdutoAberto(true)
    }

    const handleSalvarProduto = async (dados: Record<string, any>) => {
        if (!produtoEditando) return

        try {
            setErro(null)
            
            const nomeProduto = dados.nome_produto && dados.nome_produto.trim() !== '' 
                ? dados.nome_produto.trim() 
                : produtoEditando.nome
            
            if (!nomeProduto) {
                setErro('O nome do produto não pode estar vazio')
                return
            }

            // Verificar duplicidade local (antes do request)
            const produtoExistente = produtos.find(p =>
                p.nome.toLowerCase() === nomeProduto.toLowerCase() && p.id !== produtoEditando.id
            )
            if (produtoExistente) {
                setMensagemErroDuplicado(`O produto "${nomeProduto}" já está cadastrado no sistema.`)
                setModalErroDuplicado(true)
                return
            }

            await atualizarProduto(produtoEditando.id, { nome: nomeProduto })
            setModalEdicaoProdutoAberto(false)
            setProdutoEditando(null)
            await carregarDados()
            setMensagemSucesso('Produto editado com sucesso!')
            setModalSucessoAberto(true)
        } catch (err) {
            setErro(err instanceof Error ? err.message : 'Erro ao salvar produto')
        }
    }

    const handleEditarModelo = (modelo: Modelo) => {
        setModeloEditando(modelo)
        setModalEdicaoModeloAberto(true)
    }

    const handleSalvarModelo = async (dados: Record<string, any>) => {
        if (!modeloEditando) return

        try {
            setErro(null)
            
            const nomeModelo = dados.nome_modelo && dados.nome_modelo.trim() !== '' 
                ? dados.nome_modelo.trim() 
                : modeloEditando.nome
            
            if (!nomeModelo) {
                setErro('O nome do modelo não pode estar vazio')
                return
            }

            // Verificar se o nome já existe em outro modelo (ignorando o modelo atual)
            const produtosAtivosIds = new Set(produtos.map((produto) => produto.id))
            const modeloExistente = modelos.find(m => 
                m.nome.toLowerCase() === nomeModelo.toLowerCase() &&
                m.id !== modeloEditando.id &&
                m.produto_id !== undefined &&
                produtosAtivosIds.has(m.produto_id)
            )
            
            if (modeloExistente) {
                setMensagemErroDuplicado(`O modelo "${nomeModelo}" já está cadastrado no sistema.`)
                setModalErroDuplicado(true)
                return
            }

            const produtoId = dados.produto_id && dados.produto_id !== ''
                ? Number(dados.produto_id)
                : (modeloEditando.produto_id ?? 0)

            if (!produtoId) {
                setErro('Associe o modelo a um produto.')
                return
            }

            await atualizarModelo(modeloEditando.id, { nome: nomeModelo, produto_id: produtoId })
            setModalEdicaoModeloAberto(false)
            setModeloEditando(null)
            await carregarDados()
            setMensagemSucesso('Modelo editado com sucesso!')
            setModalSucessoAberto(true)
        } catch (err) {
            setErro(err instanceof Error ? err.message : 'Erro ao salvar modelo')
        }
    }

    const handleDeletarProduto = (produto: Produto) => {
        setItemParaDeletar({ tipo: 'produto', item: produto })
        setModalConfirmacao(true)
    }

    const handleDeletarModelo = (modelo: Modelo) => {
        setItemParaDeletar({ tipo: 'modelo', item: modelo })
        setModalConfirmacao(true)
    }

    const handleConfirmarDeletar = async () => {
        if (!itemParaDeletar) return

        try {
            setErro(null)

            if (itemParaDeletar.tipo === 'produto') {
                await deletarProduto((itemParaDeletar.item as Produto).id)
                setMensagemSucesso('Produto deletado com sucesso!')
            } else {
                await deletarModelo((itemParaDeletar.item as Modelo).id)
                setMensagemSucesso('Modelo deletado com sucesso!')
            }

            setModalSucessoAberto(true)
            setModalConfirmacao(false)
            setItemParaDeletar(null)
            await carregarDados()
        } catch (err) {
            setErro(err instanceof Error ? err.message : 'Erro ao deletar item')
        }
    }

    const toggleExpandirProduto = (produtoId: number) => {
        setProdutoExpandido(produtoExpandido === produtoId ? null : produtoId)
    }

    const temFiltros = filtroProduto || filtroModelo
    const inputClasses = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

    return (
        <div className="flex min-h-screen bg-gray-50">
            <MenuLateral />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 p-6 pt-32 pb-20 md:pb-24 md:pl-20 transition-all duration-300">
                    <div className="max-w-[95%] mx-auto">
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
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Produto
                                            </label>
                                            <input
                                                type="text"
                                                className={inputClasses}
                                                placeholder="Buscar por produto..."
                                                value={filtroProduto}
                                                onChange={(e) => setFiltroProduto(e.target.value)}
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Modelo
                                            </label>
                                            <input
                                                type="text"
                                                className={inputClasses}
                                                placeholder="Buscar por modelo..."
                                                value={filtroModelo}
                                                onChange={(e) => setFiltroModelo(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {erro && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <i className="bi bi-exclamation-triangle"></i>
                                        <span>{erro}</span>
                                        <button
                                            onClick={() => setErro(null)}
                                            className="ml-auto text-red-500 hover:text-red-700"
                                        >
                                            <i className="bi bi-x"></i>
                                        </button>
                                    </div>
                                </div>
                            )}

                            <>
                                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-200" style={{ backgroundColor: 'var(--bg-azul)' }}>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-8"></th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Produto</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Modelos</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Data</th>
                                                    <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {!carregando && produtosPaginaAtual.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="px-6 py-12 text-center">
                                                            <div className="flex flex-col items-center justify-center">
                                                                <i className="bi bi-inbox text-gray-300 text-5xl mb-4"></i>
                                                                <p className="text-gray-500 text-lg font-medium">
                                                                    {temFiltros 
                                                                        ? 'Nenhum produto encontrado com os filtros aplicados'
                                                                        : 'Nenhum produto cadastrado'}
                                                                </p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    produtosPaginaAtual.map((produto) => (
                                                        <>
                                                            <tr key={produto.id} className="hover:bg-gray-50">
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <button
                                                                        onClick={() => toggleExpandirProduto(produto.id)}
                                                                        className="text-gray-600 hover:text-gray-800"
                                                                    >
                                                                        <i className={`bi ${produtoExpandido === produto.id ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
                                                                    </button>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm font-medium text-gray-900">{produto.nome}</div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900">
                                                                        {produto.modelos?.length || 0} modelo(s)
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900">{formatarData(produto.data_criacao)}</div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        <button
                                                                            onClick={() => handleEditarProduto(produto)}
                                                                            className="text-blue-600 hover:text-blue-800 transition-colors"
                                                                            title="Editar Produto"
                                                                        >
                                                                            <i className="bi bi-pencil-square"></i>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeletarProduto(produto)}
                                                                            className="text-red-600 hover:text-red-800 transition-colors"
                                                                            title="Deletar Produto"
                                                                        >
                                                                            <i className="bi bi-trash"></i>
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            {produtoExpandido === produto.id && produto.modelos && produto.modelos.length > 0 && (
                                                                <tr>
                                                                    <td colSpan={5} className="px-6 py-4 bg-gray-50">
                                                                        <div className="ml-8">
                                                                            <table className="w-full">
                                                                                <tbody>
                                                                                    {produto.modelos.map((modelo) => (
                                                                                        <tr key={modelo.id} className="border-b border-gray-200 hover:bg-gray-100">
                                                                                            <td className="px-4 py-2 w-full">
                                                                                                <div className="text-sm text-gray-900">{modelo.nome}</div>
                                                                                            </td>
                                                                                            <td className="px-4 py-2 text-center whitespace-nowrap">
                                                                                                <div className="flex items-center justify-center gap-2">
                                                                                                    <button
                                                                                                        onClick={() => handleEditarModelo(modelo)}
                                                                                                        className="text-blue-600 hover:text-blue-800 transition-colors"
                                                                                                        title="Editar Modelo"
                                                                                                    >
                                                                                                        <i className="bi bi-pencil-square"></i>
                                                                                                    </button>
                                                                                                    <button
                                                                                                        onClick={() => handleDeletarModelo(modelo)}
                                                                                                        className="text-red-600 hover:text-red-800 transition-colors"
                                                                                                        title="Deletar Modelo"
                                                                                                    >
                                                                                                        <i className="bi bi-trash"></i>
                                                                                                    </button>
                                                                                                </div>
                                                                                            </td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                
                                {!carregando && produtosFiltrados.length > itensPorPagina && (
                                    <Paginacao
                                        totalItens={produtosFiltrados.length}
                                        itensPorPagina={itensPorPagina}
                                        paginaAtual={paginaAtual}
                                        onPageChange={setPaginaAtual}
                                    />
                                )}
                            </>
                        </div>
                    </div>
                </div>
            </div>

            <ModalFormulario
                isOpen={modalEdicaoProdutoAberto}
                onClose={() => {
                    setModalEdicaoProdutoAberto(false)
                    setProdutoEditando(null)
                    setErro(null)
                }}
                onSave={handleSalvarProduto}
                itemEditando={produtoEditando ? {
                    nome_produto: produtoEditando.nome
                } : null}
                tituloNovo="Novo Produto"
                tituloEditar="Editar Produto"
                campos={[
                    {
                        nome: 'nome_produto',
                        label: 'Nome do Produto',
                        tipo: 'text',
                        placeholder: 'Ex: Produto A',
                        required: true
                    }
                ]}
                textoBotao="Salvar"
                icone="bi bi-tag"
                secaoTitulo="Informações do Produto"
            />

            <ModalFormulario
                isOpen={modalEdicaoModeloAberto}
                onClose={() => {
                    setModalEdicaoModeloAberto(false)
                    setModeloEditando(null)
                    setErro(null)
                }}
                onSave={handleSalvarModelo}
                itemEditando={modeloEditando ? {
                    nome_modelo: modeloEditando.nome,
                    produto_id: modeloEditando.produto_id ? modeloEditando.produto_id.toString() : ''
                } : null}
                tituloNovo="Novo Modelo"
                tituloEditar="Editar Modelo"
                campos={[
                    {
                        nome: 'nome_modelo',
                        label: 'Nome do Modelo',
                        tipo: 'text',
                        placeholder: 'Ex: Modelo A',
                        required: true
                    },
                    {
                        nome: 'produto_id',
                        label: 'Associar a Produto',
                        tipo: 'select',
                        placeholder: 'Selecione o produto',
                        required: false,
                        opcoes: [
                            { valor: '', label: 'Nenhum' },
                            ...produtos.map(p => ({ valor: p.id.toString(), label: p.nome }))
                        ]
                    }
                ]}
                textoBotao="Salvar"
                icone="bi bi-box-seam"
                secaoTitulo="Informações do Modelo"
            />

            <ModalConfirmacao
                isOpen={modalConfirmacao}
                onClose={() => {
                    setModalConfirmacao(false)
                    setItemParaDeletar(null)
                }}
                onConfirm={handleConfirmarDeletar}
                titulo="Confirmar Exclusão"
                mensagem={
                    itemParaDeletar?.tipo === 'produto'
                        ? 'Tem certeza que deseja deletar este produto?'
                        : 'Tem certeza que deseja deletar este modelo?'
                }
                textoConfirmar="Deletar"
                textoCancelar="Cancelar"
                corHeader="vermelho"
            />

            <ModalConfirmacao
                isOpen={modalErroDuplicado}
                onClose={() => {
                    setModalErroDuplicado(false)
                    setMensagemErroDuplicado('')
                }}
                onConfirm={() => {
                    setModalErroDuplicado(false)
                    setMensagemErroDuplicado('')
                }}
                titulo="Item Já Cadastrado"
                mensagem={mensagemErroDuplicado}
                textoConfirmar="OK"
                textoCancelar=""
                corHeader="vermelho"
            />

            <ModalSucesso
                isOpen={modalSucessoAberto}
                onClose={() => {
                    setModalSucessoAberto(false)
                    setMensagemSucesso('')
                }}
                mensagem={mensagemSucesso}
                titulo="Sucesso!"
            />
        </div>
    )
}

export default ListagemProdutosModelos
