import { useState, useEffect } from 'react'
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'
import * as produtosService from '../services/produtos'
import * as modelosService from '../services/modelos'
import ModalConfirmacao from '../Components/Compartilhados/ModalConfirmacao'
// Removidos componentes de listagem e modal: tudo será inline nesta página
 

// Tipos locais removidos; serviços já definem tipos quando necessário

const Modelos = () => {
    const [abaPrincipal, setAbaPrincipal] = useState<'produto' | 'peca'>('produto')
    const [subAbaProduto, setSubAbaProduto] = useState<'novo' | 'existente'>('novo')
    const [erro, setErro] = useState<string | null>(null)
    const [modalErroDuplicado, setModalErroDuplicado] = useState(false)
    const [mensagemErroDuplicado, setMensagemErroDuplicado] = useState('')
    const [submitting, setSubmitting] = useState(false)

    // Serviços API importados acima

    // Estado para fluxos de produto novo/existente
    const [nomeProdutoNovo, setNomeProdutoNovo] = useState('')
    const [produtoSelecionadoExistente, setProdutoSelecionadoExistente] = useState<number | ''>('')

    // Estado do formulário inline de modelo e peças
    const [nomeModelo, setNomeModelo] = useState('')
    const [pecaCodigo, setPecaCodigo] = useState('')
    const [pecaNome, setPecaNome] = useState('')

    // Estado dos selects na aba "Peça"
    const [produtoParaPeca, setProdutoParaPeca] = useState<number | ''>('')
    const [modeloParaPeca, setModeloParaPeca] = useState<number | ''>('')

    // Dados carregados
    const [produtos, setProdutos] = useState<Array<{ id: number; nome: string }>>([])
    const [modelosDoProduto, setModelosDoProduto] = useState<Array<{ id: number; nome: string }>>([])

    // Troca de sub-aba com limpeza de campos para não vazar dados entre fluxos
    const handleTrocarSubAbaProduto = (proxima: 'novo' | 'existente') => {
        if (proxima === 'novo') {
            setProdutoSelecionadoExistente('')
            setNomeModelo('')
        } else {
            setNomeProdutoNovo('')
            setNomeModelo('')
        }
        setSubAbaProduto(proxima)
    }

    // Carregar produtos no início (para Produto existente e Peça)
    useEffect(() => {
        let isMounted = true
        const carregarProdutos = async () => {
            try {
                setErro(null)
                const res = await produtosService.listarProdutos()
                if (isMounted) {
                    setProdutos(res || [])
                }
            } catch (e) {
                // Evitar travar UI; apenas não popula
            }
        }
        carregarProdutos()
        return () => {
            isMounted = false
        }
    }, [])

    // Carregar modelos quando produtoParaPeca muda (para select dependente)
    useEffect(() => {
        let isMounted = true
        const carregarModelos = async () => {
            if (!produtoParaPeca) {
                setModelosDoProduto([])
                return
            }
            try {
                const res = await modelosService.listarModelosPorProduto(Number(produtoParaPeca))
                if (isMounted) {
                    setModelosDoProduto(res || [])
                }
            } catch (e) {
                setModelosDoProduto([])
            }
        }
        carregarModelos()
        return () => { isMounted = false }
    }, [produtoParaPeca])

    // Ação cadastrar para Produto novo: cria produto e depois modelo
    const handleCadastrarProdutoNovoComModelo = async () => {
        if (submitting) return
        if (!nomeProdutoNovo.trim() || !nomeModelo.trim()) return
        try {
            setErro(null)
            setSubmitting(true)
            // Validação: produto duplicado
            const existentes = await produtosService.listarProdutos()
            const existeProduto = (existentes || []).some(p => p.nome.trim().toLowerCase() === nomeProdutoNovo.trim().toLowerCase())
            if (existeProduto) {
                setMensagemErroDuplicado(`O produto "${nomeProdutoNovo.trim()}" já está cadastrado no sistema.`)
                setModalErroDuplicado(true)
                setSubmitting(false)
                return
            }
            const produtoCriado = await produtosService.criarProduto({ nome: nomeProdutoNovo.trim() })
            if (produtoCriado?.id) {
                await modelosService.criarModelo({ nome: nomeModelo.trim(), produto_id: produtoCriado.id })
            }
            // Limpeza de campos após sucesso
            setNomeProdutoNovo('')
            setNomeModelo('')
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Erro ao cadastrar produto/modelo'
            setErro(msg)
        } finally {
            setSubmitting(false)
        }
    }

    // Ação cadastrar para Produto existente: cria modelo para o produto selecionado
    const handleCadastrarModeloEmProdutoExistente = async () => {
        if (submitting) return
        if (!produtoSelecionadoExistente || !nomeModelo.trim()) return
        try {
            setErro(null)
            setSubmitting(true)
            // Validação: modelo duplicado para o produto selecionado
            const modelosJa = await modelosService.listarModelosPorProduto(Number(produtoSelecionadoExistente))
            const existeModelo = (modelosJa || []).some(m => m.nome.trim().toLowerCase() === nomeModelo.trim().toLowerCase())
            if (existeModelo) {
                setMensagemErroDuplicado(`O modelo "${nomeModelo.trim()}" já está cadastrado para este produto.`)
                setModalErroDuplicado(true)
                setSubmitting(false)
                return
            }
            await modelosService.criarModelo({
                nome: nomeModelo.trim(),
                produto_id: Number(produtoSelecionadoExistente),
            })
            // Limpar modelo após sucesso (mantém produto selecionado)
            setNomeModelo('')
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Erro ao cadastrar modelo'
            setErro(msg)
        } finally {
            setSubmitting(false)
        }
    }

    // Sem gerenciamento temporário de peças nesta página

    return (
        <>
        <div className="flex min-h-screen bg-gray-50">
            <MenuLateral />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 p-6 pt-32 pb-20 md:pb-24 md:pl-20 transition-all duration-300">
                    <div className="max-w-[95%] mx-auto">
                        <div className="flex flex-col gap-6">
                            {/* Abas principais: Produto | Peça (padrão azul/branco das demais páginas) */}
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="flex border-b border-gray-200">
                                    <button
                                        onClick={() => setAbaPrincipal('produto')}
                                        className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                                            abaPrincipal === 'produto'
                                                ? 'text-white border-b-2'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                        style={abaPrincipal === 'produto' ? { backgroundColor: 'var(--bg-azul)' } : {}}
                                    >
                                        <i className="bi bi-box-seam mr-2"></i>
                                        Produto
                                    </button>
                                    <button
                                        onClick={() => setAbaPrincipal('peca')}
                                        className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                                            abaPrincipal === 'peca'
                                                ? 'text-white border-b-2'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                        style={abaPrincipal === 'peca' ? { backgroundColor: 'var(--bg-azul)' } : {}}
                                    >
                                        <i className="bi bi-boxes mr-2"></i>
                                        Peça
                                    </button>
                                </div>

                                {/* Conteúdo do cabeçalho por aba */}
                                <div className="p-6">
                                    {abaPrincipal === 'produto' && (
                                        <>
                                            {/* Sub-abas: Produto novo | Produto existente (mesmo padrão) */}
                                            <div className="flex border rounded-md overflow-hidden mb-4 border-gray-200">
                                                <button
                                                    onClick={() => handleTrocarSubAbaProduto('novo')}
                                                    className={`flex-1 px-6 py-3 text-center text-sm font-medium transition-colors ${
                                                        subAbaProduto === 'novo'
                                                            ? 'text-white'
                                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                                    }`}
                                                    style={subAbaProduto === 'novo' ? { backgroundColor: 'var(--bg-azul)' } : {}}
                                                >
                                                    <i className="bi bi-plus-circle mr-2"></i>
                                                    Produto novo
                                                </button>
                                                <button
                                                    onClick={() => handleTrocarSubAbaProduto('existente')}
                                                    className={`flex-1 px-6 py-3 text-center text-sm font-medium transition-colors ${
                                                        subAbaProduto === 'existente'
                                                            ? 'text-white'
                                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                                    }`}
                                                    style={subAbaProduto === 'existente' ? { backgroundColor: 'var(--bg-azul)' } : {}}
                                                >
                                                    <i className="bi bi-link-45deg mr-2"></i>
                                                    Produto existente
                                                </button>
                                            </div>

                                            {/* Fluxo Produto novo com modelo */}
                                            {subAbaProduto === 'novo' && (
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Produto
                                                            </label>
                                                            <input
                                                                type="text"
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                placeholder="Ex: Produto A"
                                                                value={nomeProdutoNovo}
                                                                onChange={(e) => {
                                                                    const v = e.target.value
                                                                    setNomeProdutoNovo(v)
                                                                    if (!v.trim()) setNomeModelo('')
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Modelo
                                                            </label>
                                                            <input
                                                                type="text"
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                                                                placeholder="Ex: Modelo 1"
                                                                value={nomeModelo}
                                                                onChange={(e) => setNomeModelo(e.target.value)}
                                                                disabled={!nomeProdutoNovo.trim()}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-end gap-3">
                                                        <button
                                                            onClick={handleCadastrarProdutoNovoComModelo}
                                                            className="flex items-center gap-2 px-5 py-2.5 text-white rounded-md transition-colors"
                                                            style={{ backgroundColor: 'var(--bg-azul)' }}
                                                        >
                                                            <i className="bi bi-plus-circle-fill"></i>
                                                            <span>Cadastrar</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Fluxo Produto existente: cadastrar um modelo */}
                                            {subAbaProduto === 'existente' && (
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Produto
                                                            </label>
                                                            <select
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                                                value={produtoSelecionadoExistente}
                                                                onChange={(e) => {
                                                                    const v = e.target.value ? Number(e.target.value) : ''
                                                                    setProdutoSelecionadoExistente(v)
                                                                    if (!v) {
                                                                        setNomeModelo('')
                                                                    }
                                                                }}
                                                            >
                                                                <option value="">Selecione...</option>
                                                                {produtos.map(p => (
                                                                    <option key={p.id} value={p.id}>{p.nome}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Modelo
                                                            </label>
                                                            <input
                                                                type="text"
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                                                                placeholder="Ex: Modelo 1"
                                                                value={nomeModelo}
                                                                onChange={(e) => setNomeModelo(e.target.value)}
                                                                disabled={!produtoSelecionadoExistente}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-end gap-3">
                                                        <button
                                                            onClick={handleCadastrarModeloEmProdutoExistente}
                                                            className="flex items-center gap-2 px-5 py-2.5 text-white rounded-md transition-colors"
                                                            style={{ backgroundColor: 'var(--bg-azul)' }}
                                                        >
                                                            <i className="bi bi-plus-circle-fill"></i>
                                                            <span>Cadastrar</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {abaPrincipal === 'peca' && (
                                        <div className="space-y-4">
                                            {/* Seletores de Produto e Modelo */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Produto
                                                    </label>
                                                    <select
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                                        value={produtoParaPeca}
                                                        onChange={(e) => {
                                                            const v = e.target.value ? Number(e.target.value) : ''
                                                            setProdutoParaPeca(v)
                                                            // Ao limpar produto, limpa também o modelo selecionado
                                                            if (!v) setModeloParaPeca('')
                                                        }}
                                                    >
                                                        <option value="">Selecione...</option>
                                                        {produtos.map(p => (
                                                            <option key={p.id} value={p.id}>{p.nome}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Modelo
                                                    </label>
                                                    <select
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:text-gray-500"
                                                        value={modeloParaPeca}
                                                        onChange={(e) => setModeloParaPeca(e.target.value ? Number(e.target.value) : '')}
                                                        disabled={!produtoParaPeca}
                                                    >
                                                        <option value="">Selecione...</option>
                                                        {modelosDoProduto.map(m => (
                                                            <option key={m.id} value={m.id}>{m.nome}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Campos da peça */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Código da Peça
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                                                        placeholder="Ex: PEC001"
                                                        value={pecaCodigo}
                                                        onChange={(e) => setPecaCodigo(e.target.value)}
                                                        disabled={!produtoParaPeca || !modeloParaPeca}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Nome da Peça
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                                                        placeholder="Ex: Peça A"
                                                        value={pecaNome}
                                                        onChange={(e) => setPecaNome(e.target.value)}
                                                        disabled={!produtoParaPeca || !modeloParaPeca}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex justify-end gap-3">
                                                <button
                                                    onClick={() => {/* integração futura */}}
                                                    className="flex items-center gap-2 px-5 py-2.5 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    style={{ backgroundColor: 'var(--bg-azul)' }}
                                                    disabled={!produtoParaPeca || !modeloParaPeca || !pecaCodigo.trim() || !pecaNome.trim()}
                                                >
                                                    <i className="bi bi-plus-circle-fill"></i>
                                                    <span>Cadastrar</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Mensagem de erro */}
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

                            {/* Sem listagem/modal nesta página */}
                        </div>
                    </div>
                </div>
            </div>
        </div>

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
            titulo="Item já cadastrado"
            mensagem={mensagemErroDuplicado}
            textoConfirmar="OK"
            textoCancelar=""
            corHeader="vermelho"
        />
        </>
    )
}

export default Modelos