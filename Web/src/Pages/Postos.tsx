import { useState, useEffect, useMemo } from 'react'
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'
import ModalConfirmacao from '../Components/Compartilhados/ModalConfirmacao'
import ModalFormulario from '../Components/Compartilhados/ModalFormulario'
import ModalSucesso from '../Components/Modais/ModalSucesso'
import ModalErro from '../Components/Modais/ModalErro'
import { Paginacao } from '../Components/Compartilhados/paginacao'
import { listarSublinhas } from '../services/linhas'
import { listarDispositivos } from '../services/dispositivos'
import { listarPostos, criarPosto, atualizarPosto, deletarPosto } from '../services/postos'

interface Posto {
    posto_id: number
    nome: string
    sublinha_id: number
    toten_id: number
    serial?: string
    totem_nome?: string
    data_criacao?: string
}

interface Sublinha {
    sublinha_id: number
    linha_id: number
    nome: string
    linha_nome?: string
}

interface Toten {
    id: number
    nome: string
    serial?: string
    dispositivo_id?: number
}

const Postos = () => {
    const [abaAtiva, setAbaAtiva] = useState<'cadastrar' | 'listar'>('cadastrar')
    const [nome, setNome] = useState('')
    const [sublinhaId, setSublinhaId] = useState<number>(0)
    const [totenId, setTotenId] = useState<number>(0)
    const [postos, setPostos] = useState<Posto[]>([])
    const [sublinhas, setSublinhas] = useState<Sublinha[]>([])
    const [totens, setTotens] = useState<Toten[]>([])
    const [modalExcluirAberto, setModalExcluirAberto] = useState(false)
    const [modalSucessoAberto, setModalSucessoAberto] = useState(false)
    const [modalErroAberto, setModalErroAberto] = useState(false)
    const [mensagemSucesso, setMensagemSucesso] = useState('')
    const [mensagemErro, setMensagemErro] = useState('')
    const [tituloErro, setTituloErro] = useState('Erro!')
    const [postoSelecionado, setPostoSelecionado] = useState<Posto | null>(null)
    const [postoEditando, setPostoEditando] = useState<Posto | null>(null)
    const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false)
    const [salvandoCadastro, setSalvandoCadastro] = useState(false)
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [itensPorPagina] = useState(10)
    const [filtro, setFiltro] = useState('')

    useEffect(() => {
        carregarSublinhas()
        carregarTotens()
        carregarPostos()
    }, [])

    const carregarSublinhas = async () => {
        try {
            const subs = await listarSublinhas()
            // normalizar para o shape local esperado
            setSublinhas(
                subs.map(s => ({
                    sublinha_id: s.id,
                    linha_id: s.linha_id,
                    nome: s.nome,
                    linha_nome: s.linha_nome,
                }))
            )
            if (subs.length > 0) {
                setSublinhaId(prev => prev || subs[0].id)
            }
        } catch {
            setSublinhas([])
        }
    }

    const carregarTotens = async () => {
        try {
            const dispositivos = await listarDispositivos()
            setTotens(
                dispositivos.map(d => ({
                    id: d.id,
                    nome: d.nome,
                    serial: d.serial_number,
                    dispositivo_id: d.id,
                }))
            )
            if (dispositivos.length > 0) {
                setTotenId(prev => prev || dispositivos[0].id)
            }
        } catch {
            setTotens([])
        }
    }

    const carregarPostos = async () => {
        try {
            const resp = await listarPostos()
            setPostos(
                resp.map(p => ({
                    posto_id: p.id,
                    nome: p.nome,
                    sublinha_id: p.sublinha_id,
                    toten_id: p.dispositivo_id || 0,
                    data_criacao: p.data_criacao,
                }))
            )
        } catch {
            setPostos([])
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!nome.trim()) {
            setTituloErro('Erro!')
            setMensagemErro('Informe o nome do posto')
            setModalErroAberto(true)
            return
        }

        if (!sublinhaId) {
            setTituloErro('Erro!')
            setMensagemErro('Selecione uma sublinha')
            setModalErroAberto(true)
            return
        }

        if (!totenId) {
            setTituloErro('Erro!')
            setMensagemErro('Selecione um toten')
            setModalErroAberto(true)
            return
        }

        // Validação simples de duplicidade no cliente:
        // sublinha + dispositivo devem ser únicos (independente do nome)
        const nomeTrim = nome.trim()
        const existeDuplicado = postos.some(p =>
            p.sublinha_id === sublinhaId &&
            p.toten_id === (totenId || 0)
        )
        if (existeDuplicado) {
            setTituloErro('Duplicado')
            setMensagemErro('Já existe um posto para esta sublinha e dispositivo.')
            setModalErroAberto(true)
            return
        }

        try {
            setSalvandoCadastro(true)
            await criarPosto({
                nome: nomeTrim,
                sublinha_id: sublinhaId,
                dispositivo_id: totenId || undefined,
            })
            setMensagemSucesso('Posto cadastrado com sucesso!')
            setModalSucessoAberto(true)
            setNome('')
            if (sublinhas.length > 0) setSublinhaId(sublinhas[0].sublinha_id)
            if (totens.length > 0) setTotenId(totens[0].id)
            await carregarPostos()
        } catch (e: any) {
            setTituloErro('Erro!')
            setMensagemErro(e?.message || 'Erro ao salvar posto')
            setModalErroAberto(true)
        } finally {
            setSalvandoCadastro(false)
        }
    }

    const handleEditarPosto = (posto: Posto) => {
        setPostoEditando(posto)
        setModalEdicaoAberto(true)
    }

    const handleSalvarEdicaoModal = async (dados: Record<string, any>) => {
        if (!postoEditando) return
        try {
            await atualizarPosto(postoEditando.posto_id, {
                nome: dados.nome,
                sublinha_id: Number(dados.sublinha_id),
                dispositivo_id: Number(dados.toten_id) || undefined,
            })
            setModalEdicaoAberto(false)
            setPostoEditando(null)
            await carregarPostos()
            setMensagemSucesso('Posto atualizado com sucesso!')
            setModalSucessoAberto(true)
        } catch (e: any) {
            setTituloErro('Erro!')
            setMensagemErro(e?.message || 'Erro ao atualizar posto')
            setModalErroAberto(true)
        }
    }

    const handleExcluirPosto = (posto: Posto) => {
        setPostoSelecionado(posto)
        setModalExcluirAberto(true)
    }

    const handleConfirmarExclusao = async () => {
        if (!postoSelecionado) return
        
        try {
            await deletarPosto(postoSelecionado.posto_id)
            fecharModal()
            setMensagemSucesso('Posto excluído com sucesso!')
            setModalSucessoAberto(true)
            await carregarPostos()
        } catch (e: any) {
            fecharModal()
            setTituloErro('Erro!')
            setMensagemErro(e?.message || 'Erro ao excluir posto')
            setModalErroAberto(true)
        }
    }

    const fecharModal = () => {
        setModalExcluirAberto(false)
        setPostoSelecionado(null)
    }

    const cancelarEdicao = () => {
        setPostoEditando(null)
        setNome('')
        if (sublinhas.length > 0) {
            setSublinhaId(sublinhas[0].sublinha_id)
        }
        if (totens.length > 0) {
            setTotenId(totens[0].id)
        }
    }

    const postosFiltrados = useMemo(() => {
        return postos.filter(p =>
            !filtro || p.nome.toLowerCase().includes(filtro.toLowerCase())
        )
    }, [postos, filtro])

    const temFiltros = Boolean(filtro)
    const formularioCadastroInvalido =
        salvandoCadastro ||
        !nome.trim() ||
        !sublinhaId ||
        !totenId

    const indiceInicio = (paginaAtual - 1) * itensPorPagina
    const postosPaginaAtual = postosFiltrados.slice(indiceInicio, indiceInicio + itensPorPagina)

    useEffect(() => {
        setPaginaAtual(1)
    }, [filtro])

    useEffect(() => {
        const totalPaginas = Math.ceil(postosFiltrados.length / itensPorPagina)
        if (paginaAtual > totalPaginas && totalPaginas > 0) {
            setPaginaAtual(totalPaginas)
        }
    }, [postosFiltrados.length, itensPorPagina, paginaAtual])

    const obterNomeSublinha = (sublinhaId: number) => {
        const sublinha = sublinhas.find(s => s.sublinha_id === sublinhaId)
        if (!sublinha) return 'Não encontrada'
        return sublinha.linha_nome ? `${sublinha.linha_nome} - ${sublinha.nome}` : sublinha.nome
    }

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
                                    <i className="bi bi-geo-alt-fill mr-2"></i>
                                    Cadastrar Posto
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
                                    Listar Postos
                                </button>
                            </div>

                            <div className={abaAtiva === 'cadastrar' ? 'p-6' : ''}>
                                {abaAtiva === 'cadastrar' && (
                                    <form id="form-posto" onSubmit={handleSubmit}>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nome do Posto
                                            </label>
                                            <input
                                                type="text"
                                                id="posto-nome"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                required
                                                placeholder="Ex: Posto 1"
                                                value={nome}
                                                onChange={(e) => setNome(e.target.value)}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Sublinha
                                                </label>
                                                <select
                                                    id="posto-sublinha"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    required
                                                    value={sublinhaId}
                                                    onChange={(e) => setSublinhaId(Number(e.target.value))}
                                                >
                                                    <option value={0}>Selecione uma sublinha</option>
                                                    {sublinhas.map((sublinha) => (
                                                        <option key={sublinha.sublinha_id} value={sublinha.sublinha_id}>
                                                            {sublinha.linha_nome ? `${sublinha.linha_nome} - ${sublinha.nome}` : sublinha.nome}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Usuário Raspberry
                                                </label>
                                                <select
                                                    id="posto-toten"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    required
                                                    value={totenId}
                                                    onChange={(e) => setTotenId(Number(e.target.value))}
                                                >
                                                    <option value={0}>Selecione um usuário Raspberry</option>
                                                    {totens.map((toten) => (
                                                        <option key={toten.id} value={toten.id}>
                                                            {toten.nome} {toten.serial ? `(Serial: ${toten.serial})` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                type="submit"
                                                className="flex items-center gap-2 px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-60"
                                                style={{ backgroundColor: 'var(--bg-azul)' }}
                                                onMouseEnter={(e) => {
                                                    if (!e.currentTarget.disabled) e.currentTarget.style.opacity = '0.9'
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!e.currentTarget.disabled) e.currentTarget.style.opacity = '1'
                                                }}
                                                disabled={formularioCadastroInvalido}
                                            >
                                                <i className="bi bi-plus-circle-fill"></i>
                                                <span>{salvandoCadastro ? 'Salvando...' : 'Cadastrar'}</span>
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
                                                    onClick={() => setFiltro('')}
                                                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                >
                                                    <i className="bi bi-x-circle"></i>
                                                    Limpar Filtros
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-w-xs">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Posto</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Buscar por posto..."
                                                value={filtro}
                                                onChange={(e) => setFiltro(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-200" style={{ backgroundColor: 'var(--bg-azul)' }}>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Posto</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Linha/Sublinha</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Dispositivo</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Data Criação</th>
                                                    <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {postosPaginaAtual.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="px-6 py-12 text-center">
                                                            <div className="flex flex-col items-center justify-center">
                                                                <i className="bi bi-inbox text-gray-300 text-5xl mb-4"></i>
                                                                <p className="text-gray-500 text-lg font-medium">
                                                                    {temFiltros ? 'Nenhum posto encontrado com os filtros aplicados' : 'Nenhum posto cadastrado'}
                                                                </p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    postosPaginaAtual.map((posto) => {
                                                        const dispositivo = totens.find(t => t.id === posto.toten_id)
                                                        return (
                                                            <tr key={posto.posto_id} className="hover:bg-gray-50">
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm font-medium text-gray-900">{posto.nome}</div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900">{obterNomeSublinha(posto.sublinha_id)}</div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900">
                                                                        {dispositivo ? `${dispositivo.nome}${dispositivo.serial ? ` (${dispositivo.serial})` : ''}` : '-'}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900">
                                                                        {posto.data_criacao ? new Date(posto.data_criacao).toLocaleDateString('pt-BR') : '-'}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        <button
                                                                            onClick={() => handleEditarPosto(posto)}
                                                                            className="text-blue-600 hover:text-blue-800 transition-colors"
                                                                            title="Editar posto"
                                                                        >
                                                                            <i className="bi bi-pencil-square"></i>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleExcluirPosto(posto)}
                                                                            className="text-red-600 hover:text-red-800 transition-colors"
                                                                            title="Excluir posto"
                                                                        >
                                                                            <i className="bi bi-trash"></i>
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {postosFiltrados.length > itensPorPagina && (
                                    <Paginacao
                                        totalItens={postosFiltrados.length}
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

            <ModalConfirmacao
                isOpen={modalExcluirAberto}
                onClose={fecharModal}
                onConfirm={handleConfirmarExclusao}
                titulo="Excluir Posto"
                mensagem="Tem certeza que deseja excluir este posto?"
                textoConfirmar="Excluir"
                textoCancelar="Cancelar"
                corHeader="vermelho"
            />

            <ModalFormulario
                isOpen={modalEdicaoAberto}
                onClose={() => {
                    setModalEdicaoAberto(false)
                    setPostoEditando(null)
                }}
                onSave={handleSalvarEdicaoModal}
                itemEditando={
                    postoEditando
                        ? {
                              nome: postoEditando.nome,
                              sublinha_id: String(postoEditando.sublinha_id),
                              toten_id: String(postoEditando.toten_id),
                          }
                        : null
                }
                tituloNovo="Novo Posto"
                tituloEditar="Editar Posto"
                campos={[
                    {
                        nome: 'nome',
                        label: 'Nome do Posto',
                        tipo: 'text',
                        placeholder: 'Ex: Posto 1',
                        required: true,
                    },
                    {
                        nome: 'sublinha_id',
                        label: 'Sublinha',
                        tipo: 'select',
                        required: true,
                        opcoes: sublinhas.map(s => ({
                            valor: String(s.sublinha_id),
                            label: s.linha_nome ? `${s.linha_nome} - ${s.nome}` : s.nome,
                        })),
                    },
                    {
                        nome: 'toten_id',
                        label: 'Dispositivo',
                        tipo: 'select',
                        required: true,
                        opcoes: totens.map(t => ({
                            valor: String(t.id),
                            label: t.nome + (t.serial ? ` (${t.serial})` : ''),
                        })),
                    },
                ]}
                textoBotao="Salvar"
                icone="bi bi-geo-alt-fill"
                secaoTitulo="Informações do Posto"
            />

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
        </div>
    )
}

export default Postos
