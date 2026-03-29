import { useEffect, useState, type FormEvent } from 'react'
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'
import {
    criarProduto,
    listarProdutos,
    type Produto as ProdutoApi,
} from '../services/produtos'
import { criarModelo } from '../services/modelos'

type Aba = 'produtos' | 'modelos'
type AbaProduto = 'novo' | 'existente'

const ProdutosModelos = () => {
    const [aba, setAba] = useState<Aba>('produtos')
    const [abaProduto, setAbaProduto] = useState<AbaProduto>('novo')
    const [produtos, setProdutos] = useState<ProdutoApi[]>([])
    const [carregandoProdutos, setCarregandoProdutos] = useState(true)
    const [erro, setErro] = useState<string | null>(null)
    const [sucesso, setSucesso] = useState<string | null>(null)

    const [nomeProduto, setNomeProduto] = useState('')
    const [nomeModeloProdutoNovo, setNomeModeloProdutoNovo] = useState('')
    const [nomeModelo, setNomeModelo] = useState('')
    const [produtoSelecionadoId, setProdutoSelecionadoId] = useState('')
    const [salvandoProduto, setSalvandoProduto] = useState(false)
    const [salvandoModelo, setSalvandoModelo] = useState(false)

    const carregarProdutos = async () => {
        try {
            setCarregandoProdutos(true)
            const dados = await listarProdutos()
            setProdutos(dados)
        } catch (err) {
            setErro(err instanceof Error ? err.message : 'Erro ao carregar produtos')
        } finally {
            setCarregandoProdutos(false)
        }
    }

    useEffect(() => {
        carregarProdutos()
    }, [])

    useEffect(() => {
        if (!nomeProduto.trim()) {
            setNomeModeloProdutoNovo('')
        }
    }, [nomeProduto])

    const limparMensagens = () => {
        setErro(null)
        setSucesso(null)
    }

    const handleSalvarProduto = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!nomeProduto.trim() || !nomeModeloProdutoNovo.trim()) {
            return
        }

        try {
            limparMensagens()
            setSalvandoProduto(true)
            const produtoCriado = await criarProduto({ nome: nomeProduto.trim() })
            await criarModelo({
                nome: nomeModeloProdutoNovo.trim(),
                produto_id: produtoCriado.id,
            })
            setNomeProduto('')
            setNomeModeloProdutoNovo('')
            setSucesso('Produto e modelo cadastrados com sucesso.')
            await carregarProdutos()
        } catch (err) {
            setErro(err instanceof Error ? err.message : 'Erro ao cadastrar produto e modelo')
        } finally {
            setSalvandoProduto(false)
        }
    }

    const handleSalvarModelo = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!nomeModelo.trim() || !produtoSelecionadoId) {
            return
        }

        try {
            limparMensagens()
            setSalvandoModelo(true)
            await criarModelo({
                nome: nomeModelo.trim(),
                produto_id: Number(produtoSelecionadoId),
            })
            setNomeModelo('')
            setProdutoSelecionadoId('')
            setSucesso('Modelo cadastrado com sucesso.')
        } catch (err) {
            setErro(err instanceof Error ? err.message : 'Erro ao cadastrar modelo')
        } finally {
            setSalvandoModelo(false)
        }
    }

    const inputClasses = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all'

    return (
        <div className="flex min-h-screen bg-gray-50">
            <MenuLateral />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 p-6 pt-32 pb-20 md:pb-24 md:pl-20 transition-all duration-300">
                    <div className="max-w-[95%] mx-auto">
                        <div className="flex flex-col gap-6">
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="flex border-b border-gray-200">
                                    <button
                                        onClick={() => {
                                            limparMensagens()
                                            setAba('produtos')
                                        }}
                                        className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                                            aba === 'produtos'
                                                ? 'text-white'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                        style={aba === 'produtos' ? { backgroundColor: 'var(--bg-azul)' } : {}}
                                        type="button"
                                    >
                                        Cadastro de Produto
                                    </button>
                                    <button
                                        onClick={() => {
                                            limparMensagens()
                                            setAba('modelos')
                                        }}
                                        className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                                            aba === 'modelos'
                                                ? 'text-white'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                        style={aba === 'modelos' ? { backgroundColor: 'var(--bg-azul)' } : {}}
                                        type="button"
                                    >
                                        Cadastro de Modelo
                                    </button>
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
                                            type="button"
                                        >
                                            <i className="bi bi-x"></i>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {sucesso && (
                                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <i className="bi bi-check-circle"></i>
                                        <span>{sucesso}</span>
                                        <button
                                            onClick={() => setSucesso(null)}
                                            className="ml-auto text-green-500 hover:text-green-700"
                                            type="button"
                                        >
                                            <i className="bi bi-x"></i>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {aba === 'produtos' ? (
                                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="border-b border-gray-200 flex">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                limparMensagens()
                                                setAbaProduto('novo')
                                            }}
                                            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                                                abaProduto === 'novo'
                                                    ? 'text-white'
                                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                            }`}
                                            style={abaProduto === 'novo' ? { backgroundColor: 'var(--bg-azul)' } : {}}
                                        >
                                            Produto Novo
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                limparMensagens()
                                                setAbaProduto('existente')
                                            }}
                                            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                                                abaProduto === 'existente'
                                                    ? 'text-white'
                                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                            }`}
                                            style={abaProduto === 'existente' ? { backgroundColor: 'var(--bg-azul)' } : {}}
                                        >
                                            Produto Existente
                                        </button>
                                    </div>

                                    {abaProduto === 'novo' ? (
                                        <form onSubmit={handleSalvarProduto} className="p-6 flex flex-col gap-5">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Produto
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className={inputClasses}
                                                        placeholder="Digite o nome do produto"
                                                        value={nomeProduto}
                                                        onChange={(e) => setNomeProduto(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Modelo
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className={`${inputClasses} disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed`}
                                                        placeholder={nomeProduto.trim() ? 'Digite o nome do modelo' : 'Preencha o produto para habilitar'}
                                                        value={nomeModeloProdutoNovo}
                                                        onChange={(e) => setNomeModeloProdutoNovo(e.target.value)}
                                                        disabled={!nomeProduto.trim()}
                                                        required={!!nomeProduto.trim()}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end">
                                                <button
                                                    type="submit"
                                                    className="px-5 py-2.5 text-white rounded-lg transition-opacity disabled:opacity-60"
                                                    style={{ backgroundColor: 'var(--bg-azul)' }}
                                                    disabled={
                                                        salvandoProduto ||
                                                        !nomeProduto.trim() ||
                                                        !nomeModeloProdutoNovo.trim()
                                                    }
                                                >
                                                    {salvandoProduto ? 'Salvando...' : 'Cadastrar Produto'}
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="p-6">
                                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-5 text-gray-600">
                                                A aba Produto Existente fica pronta no proximo ajuste.
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="text-white px-6 py-4" style={{ backgroundColor: 'var(--bg-azul)' }}>
                                        <h3 className="text-lg font-semibold flex items-center gap-2">
                                            <i className="bi bi-diagram-3"></i>
                                            Novo Modelo
                                        </h3>
                                    </div>
                                    <form onSubmit={handleSalvarModelo} className="p-6 flex flex-col gap-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Produto Vinculado
                                            </label>
                                            <select
                                                className={inputClasses}
                                                value={produtoSelecionadoId}
                                                onChange={(e) => setProdutoSelecionadoId(e.target.value)}
                                                disabled={carregandoProdutos || produtos.length === 0}
                                                required
                                            >
                                                <option value="">
                                                    {carregandoProdutos ? 'Carregando produtos...' : 'Selecione um produto'}
                                                </option>
                                                {produtos.map((produto) => (
                                                    <option key={produto.id} value={String(produto.id)}>
                                                        {produto.nome}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nome do Modelo
                                            </label>
                                            <input
                                                type="text"
                                                className={inputClasses}
                                                placeholder="Ex: Modelo de Produto A"
                                                value={nomeModelo}
                                                onChange={(e) => setNomeModelo(e.target.value)}
                                                required
                                            />
                                        </div>

                                        {(!carregandoProdutos && produtos.length === 0) && (
                                            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                                                Cadastre um produto antes de criar um modelo.
                                            </div>
                                        )}

                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                className="px-5 py-2.5 text-white rounded-lg transition-opacity disabled:opacity-60"
                                                style={{ backgroundColor: 'var(--bg-azul)' }}
                                                disabled={
                                                    salvandoModelo ||
                                                    !nomeModelo.trim() ||
                                                    !produtoSelecionadoId ||
                                                    produtos.length === 0
                                                }
                                            >
                                                {salvandoModelo ? 'Salvando...' : 'Cadastrar Modelo'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProdutosModelos

