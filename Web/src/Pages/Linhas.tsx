import { useState, useEffect, useMemo } from 'react'
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'
import { Paginacao } from '../Components/Compartilhados/paginacao'
import ModalFormulario from '../Components/Compartilhados/ModalFormulario'
import ModalSucesso from '../Components/Modais/ModalSucesso'
import ModalErro from '../Components/Modais/ModalErro'
import ModalConfirmacao from '../Components/Compartilhados/ModalConfirmacao'
import {
    listarLinhas,
    listarSublinhas,
    atualizarLinha,
    atualizarSublinha,
    deletarLinha,
    criarLinhaComSublinha,
} from '../services/linhas'

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
    const [carregandoListagem, setCarregandoListagem] = useState(false)
    const [linhaEditando, setLinhaEditando] = useState<Linha | null>(null)
    const [modalEdicaoLinhaAberto, setModalEdicaoLinhaAberto] = useState(false)
    const [filtroLinha, setFiltroLinha] = useState('')
    const [paginaAtual, setPaginaAtual] = useState(1)
    const itensPorPagina = 10

    const [modalSucessoAberto, setModalSucessoAberto] = useState(false)
    const [modalErroAberto, setModalErroAberto] = useState(false)
    const [mensagemSucesso, setMensagemSucesso] = useState('')
    const [mensagemErro, setMensagemErro] = useState('')
    const [tituloErro, setTituloErro] = useState('Erro!')

    const [modalConfirmacaoLinhaAberto, setModalConfirmacaoLinhaAberto] = useState(false)
    const [linhaIdParaExcluir, setLinhaIdParaExcluir] = useState<number | null>(null)

    useEffect(() => {
        if (abaAtiva === 'listar') {
            carregarLinhas()
        }
    }, [abaAtiva])

    const carregarLinhas = async () => {
        setCarregandoListagem(true)
        try {
            const resp = await listarLinhas()
            const normalizadas: Linha[] = Array.isArray(resp)
                ? resp.map((l: any) => ({
                      id: l.id,
                      nome: l.nome,
                      data_criacao: l.data_criacao,
                      sublinhas: Array.isArray(l.sublinhas)
                          ? l.sublinhas.map((s: any) => ({
                                id: s.id,
                                linha_id: s.linha_id,
                                nome: s.nome,
                            }))
                          : [],
                  }))
                : []
            setLinhas(normalizadas)
        } catch (e: any) {
            setTituloErro('Erro!')
            setMensagemErro(e?.message || 'Erro ao carregar linhas')
            setModalErroAberto(true)
            setLinhas([])
        } finally {
            setCarregandoListagem(false)
        }
    }

    const nomesIguaisIgnorandoCase = (a: string, b: string) => {
        return a.trim().toLocaleLowerCase('pt-BR') === b.trim().toLocaleLowerCase('pt-BR')
    }

    const normalizarNome = (valor: string) => valor.trim().toLocaleLowerCase('pt-BR')

    const handleCadastrarComposto = async (e: React.FormEvent) => {
        e.preventDefault()

        const nomeLinhaLimpo = nomeLinha.trim()
        const nomeSublinhaLimpo = nomeSublinha.trim()

        if (!nomeLinhaLimpo || !nomeSublinhaLimpo) {
            setTituloErro('Erro!')
            setMensagemErro('Informe o nome da linha e da sublinha')
            setModalErroAberto(true)
            return
        }

        if (nomesIguaisIgnorandoCase(nomeLinhaLimpo, nomeSublinhaLimpo)) {
            setTituloErro('Nomes iguais nao permitidos')
            setMensagemErro('O nome da linha e da sublinha nao podem ser iguais.')
            setModalErroAberto(true)
            return
        }

        try {
            const linhasExistentes = await listarLinhas()
            const jaExisteCombinacao = Array.isArray(linhasExistentes)
                ? linhasExistentes.some((linha: any) =>
                      normalizarNome(linha?.nome || '') === normalizarNome(nomeLinhaLimpo) &&
                      Array.isArray(linha?.sublinhas) &&
                      linha.sublinhas.some(
                          (s: any) => normalizarNome(s?.nome || '') === normalizarNome(nomeSublinhaLimpo)
                      )
                  )
                : false

            if (jaExisteCombinacao) {
                setTituloErro('Combinacao duplicada')
                setMensagemErro('Ja existe uma linha e sublinha cadastradas com esses nomes.')
                setModalErroAberto(true)
                return
            }

            await criarLinhaComSublinha({
                nome_linha: nomeLinhaLimpo,
                nome_sublinha: nomeSublinhaLimpo,
            })
            setNomeLinha('')
            setNomeSublinha('')
            setMensagemSucesso('Linha e sublinha criadas com sucesso!')
            setModalSucessoAberto(true)
            if (abaAtiva === 'listar') {
                await carregarLinhas()
            }
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
            setMensagemSucesso('Linha excluida com sucesso!')
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
        setLinhaEditando(linha)
        setModalEdicaoLinhaAberto(true)
    }

    const handleSalvarEdicaoLinha = async (dados: Record<string, any>) => {
        if (!linhaEditando) return

        const nomeLinha = dados.nome_linha?.trim() || linhaEditando.nome
        const nomeSublinha =
            dados.nome_sublinha?.trim() || linhaEditando.sublinhas?.[0]?.nome || ''

        if (!nomeLinha) {
            setTituloErro('Erro!')
            setMensagemErro('O nome da linha nao pode estar vazio')
            setModalErroAberto(true)
            return
        }

        if (nomesIguaisIgnorandoCase(nomeLinha, nomeSublinha)) {
            setTituloErro('Nomes iguais nao permitidos')
            setMensagemErro('O nome da linha e da sublinha nao podem ser iguais.')
            setModalErroAberto(true)
            return
        }

        const existeOutraLinhaComMesmoNome = linhas.some(
            (linha) =>
                linha.id !== linhaEditando.id &&
                normalizarNome(linha.nome) === normalizarNome(nomeLinha)
        )

        if (existeOutraLinhaComMesmoNome) {
            setTituloErro('Nome de linha ja existente')
            setMensagemErro('Ja existe uma linha cadastrada com esse nome.')
            setModalErroAberto(true)
            return
        }

        const existeOutraSublinhaComMesmoNome = linhas.some(
            (linha) =>
                linha.id !== linhaEditando.id &&
                normalizarNome(linha.sublinhas?.[0]?.nome || '') === normalizarNome(nomeSublinha)
        )

        if (nomeSublinha && existeOutraSublinhaComMesmoNome) {
            setTituloErro('Nome de sublinha ja existente')
            setMensagemErro('Ja existe uma sublinha cadastrada com esse nome.')
            setModalErroAberto(true)
            return
        }

        try {
            await atualizarLinha(linhaEditando.id, { nome: nomeLinha })

            // Atualiza a sublinha associada; se não vier no estado, busca por linha_id.
            let sublinhaAtual: Sublinha | undefined = linhaEditando.sublinhas?.[0]
            if (!sublinhaAtual?.id) {
                const sublinhas = await listarSublinhas()
                sublinhaAtual = sublinhas.find((s) => s.linha_id === linhaEditando.id)
            }

            if (sublinhaAtual?.id && nomeSublinha) {
                await atualizarSublinha(Number(sublinhaAtual.id), {
                    nome: nomeSublinha,
                    linha_id: linhaEditando.id,
                })
            }

            setModalEdicaoLinhaAberto(false)
            setLinhaEditando(null)
            await carregarLinhas()
            setMensagemSucesso('Linha atualizada com sucesso!')
            setModalSucessoAberto(true)
        } catch (e: any) {
            setTituloErro('Erro!')
            setMensagemErro(e?.message || 'Erro ao atualizar linha')
            setModalErroAberto(true)
        }
    }

    const formatarData = (data: string | undefined) => {
        if (!data) return '-'
        try {
            return new Date(data).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            })
        } catch {
            return data
        }
    }

    const linhasFiltradas = useMemo(() => {
        return linhas.filter((linha) =>
            !filtroLinha || linha.nome.toLowerCase().includes(filtroLinha.toLowerCase())
        )
    }, [linhas, filtroLinha])

    useEffect(() => {
        setPaginaAtual(1)
    }, [filtroLinha])

    const indiceInicio = (paginaAtual - 1) * itensPorPagina
    const linhasPaginaAtual = linhasFiltradas.slice(indiceInicio, indiceInicio + itensPorPagina)
    const temFiltros = Boolean(filtroLinha)
    const inputClasses =
        'w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'

    useEffect(() => {
        const totalPaginas = Math.ceil(linhasFiltradas.length / itensPorPagina)
        if (paginaAtual > totalPaginas && totalPaginas > 0) {
            setPaginaAtual(totalPaginas)
        }
    }, [linhasFiltradas.length, paginaAtual])

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
                                    onClick={() => {
                                        setCarregandoListagem(true)
                                        setAbaAtiva('listar')
                                    }}
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

                            <div className={abaAtiva === 'cadastrar' ? 'p-6' : ''}>
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
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.opacity = '0.9'
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.opacity = '1'
                                                }}
                                            >
                                                <i className="bi bi-plus-circle-fill"></i>
                                                <span>Cadastrar</span>
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>

                        {abaAtiva === 'listar' && (
                            <div className="flex flex-col gap-6 mt-6">
                                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                                <i className="bi bi-funnel"></i>
                                                Filtros de Busca
                                            </h4>
                                            {temFiltros && (
                                                <button
                                                    onClick={() => setFiltroLinha('')}
                                                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                >
                                                    <i className="bi bi-x-circle"></i>
                                                    Limpar Filtros
                                                </button>
                                            )}
                                        </div>

                                        <div className="max-w-xs">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Linha
                                            </label>
                                            <input
                                                type="text"
                                                className={inputClasses}
                                                placeholder="Buscar por linha..."
                                                value={filtroLinha}
                                                onChange={(e) => setFiltroLinha(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-200" style={{ backgroundColor: 'var(--bg-azul)' }}>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Linha</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Sublinha</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Data</th>
                                                    <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Acoes</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {!carregandoListagem && linhasPaginaAtual.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} className="px-6 py-12 text-center">
                                                            <div className="flex flex-col items-center justify-center">
                                                                <i className="bi bi-inbox text-gray-300 text-5xl mb-4"></i>
                                                                <p className="text-gray-500 text-lg font-medium">
                                                                    {temFiltros
                                                                        ? 'Nenhuma linha encontrada com os filtros aplicados'
                                                                        : 'Nenhuma linha cadastrada'}
                                                                </p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : !carregandoListagem ? (
                                                    linhasPaginaAtual.map((linha) => (
                                                        <tr key={linha.id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm font-medium text-gray-900">{linha.nome}</div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-gray-900">{linha.sublinhas?.[0]?.nome || '-'}</div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-gray-900">{formatarData(linha.data_criacao)}</div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button
                                                                        onClick={() => handleIniciarEdicaoLinha(linha)}
                                                                        className="text-blue-600 hover:text-blue-800 transition-colors"
                                                                        title="Editar Linha"
                                                                    >
                                                                        <i className="bi bi-pencil-square"></i>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleExcluirLinha(linha.id)}
                                                                        className="text-red-600 hover:text-red-800 transition-colors"
                                                                        title="Deletar Linha"
                                                                    >
                                                                        <i className="bi bi-trash"></i>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : null
                                                }
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {linhasFiltradas.length > itensPorPagina && (
                                    <Paginacao
                                        totalItens={linhasFiltradas.length}
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

            <ModalFormulario
                isOpen={modalEdicaoLinhaAberto}
                onClose={() => {
                    setModalEdicaoLinhaAberto(false)
                    setLinhaEditando(null)
                }}
                onSave={handleSalvarEdicaoLinha}
                itemEditando={
                    linhaEditando
                        ? {
                              nome_linha: linhaEditando.nome,
                              nome_sublinha: linhaEditando.sublinhas?.[0]?.nome || '',
                          }
                        : null
                }
                tituloNovo="Nova Linha"
                tituloEditar="Editar Linha"
                campos={[
                    {
                        nome: 'nome_linha',
                        label: 'Nome da Linha',
                        tipo: 'text',
                        placeholder: 'Ex: Linha 1',
                        required: true,
                    },
                    {
                        nome: 'nome_sublinha',
                        label: 'Nome da Sublinha',
                        tipo: 'text',
                        placeholder: 'Ex: Sublinha A',
                        required: false,
                    },
                ]}
                textoBotao="Salvar"
                icone="bi bi-diagram-3"
                secaoTitulo="Informacoes da Linha"
            />

            <ModalConfirmacao
                isOpen={modalConfirmacaoLinhaAberto}
                onClose={() => {
                    setModalConfirmacaoLinhaAberto(false)
                    setLinhaIdParaExcluir(null)
                }}
                onConfirm={confirmarExcluirLinha}
                titulo="Confirmar Exclusao"
                mensagem="Tem certeza que deseja excluir esta linha?"
                textoConfirmar="Excluir"
                textoCancelar="Cancelar"
                corHeader="vermelho"
            />
        </div>
    )
}

export default Linhas
