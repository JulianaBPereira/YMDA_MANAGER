import { useState, useEffect } from 'react'
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'
import ModalConfirmacao from '../Components/Compartilhados/ModalConfirmacao'
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
    const [carregando, setCarregando] = useState(false)
    const [modalExcluirAberto, setModalExcluirAberto] = useState(false)
    const [modalSucessoAberto, setModalSucessoAberto] = useState(false)
    const [modalErroAberto, setModalErroAberto] = useState(false)
    const [mensagemSucesso, setMensagemSucesso] = useState('')
    const [mensagemErro, setMensagemErro] = useState('')
    const [tituloErro, setTituloErro] = useState('Erro!')
    const [postoSelecionado, setPostoSelecionado] = useState<Posto | null>(null)
    const [postoEditando, setPostoEditando] = useState<Posto | null>(null)
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [itensPorPagina] = useState(10)

    useEffect(() => {
        carregarSublinhas()
        carregarTotens()
        if (abaAtiva === 'listar') {
            carregarPostos()
        }
    }, [abaAtiva])

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
        setCarregando(true)
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
        } finally {
            setCarregando(false)
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
            p.toten_id === (totenId || 0) &&
            (!postoEditando || p.posto_id !== postoEditando.posto_id)
        )
        if (existeDuplicado) {
            setTituloErro('Duplicado')
            setMensagemErro('Já existe um posto para esta sublinha e dispositivo.')
            setModalErroAberto(true)
            return
        }

        try {
            if (postoEditando) {
                await atualizarPosto(postoEditando.posto_id, {
                    nome: nomeTrim,
                    sublinha_id: sublinhaId,
                    dispositivo_id: totenId || undefined,
                })
                setMensagemSucesso('Posto atualizado com sucesso!')
                setModalSucessoAberto(true)
                setPostoEditando(null)
            } else {
                await criarPosto({
                    nome: nomeTrim,
                    sublinha_id: sublinhaId,
                    dispositivo_id: totenId || undefined,
                })
                setMensagemSucesso('Posto cadastrado com sucesso!')
                setModalSucessoAberto(true)
            }
            setNome('')
            if (sublinhas.length > 0) setSublinhaId(sublinhas[0].sublinha_id)
            if (totens.length > 0) setTotenId(totens[0].id)
            await carregarPostos()
        } catch (e: any) {
            setTituloErro('Erro!')
            setMensagemErro(e?.message || 'Erro ao salvar posto')
            setModalErroAberto(true)
        }
    }

    const handleEditarPosto = (posto: Posto) => {
        setPostoEditando(posto)
        setNome(posto.nome)
        setSublinhaId(posto.sublinha_id)
        setTotenId(posto.toten_id)
        setAbaAtiva('cadastrar')
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

    const indiceInicio = (paginaAtual - 1) * itensPorPagina
    const indiceFim = indiceInicio + itensPorPagina
    const postosPaginaAtual = postos.slice(indiceInicio, indiceFim)

    useEffect(() => {
        const totalPaginas = Math.ceil(postos.length / itensPorPagina)
        if (paginaAtual > totalPaginas && totalPaginas > 0) {
            setPaginaAtual(totalPaginas)
        }
    }, [postos.length, itensPorPagina, paginaAtual])

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
                                    onClick={() => {
                                        setAbaAtiva('cadastrar')
                                        cancelarEdicao()
                                    }}
                                    className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                                        abaAtiva === 'cadastrar'
                                            ? 'text-white border-b-2'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                    style={abaAtiva === 'cadastrar' ? { backgroundColor: 'var(--bg-azul)' } : {}}
                                >
                                    <i className="bi bi-geo-alt-fill mr-2"></i>
                                    {postoEditando ? 'Editar Posto' : 'Cadastrar Posto'}
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

                            <div className="p-6">
                                {abaAtiva === 'cadastrar' ? (
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
                                                className="flex items-center gap-2 px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                                                style={{ backgroundColor: 'var(--bg-azul)' }}
                                                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                            >
                                                <i className={postoEditando ? 'bi bi-check-lg' : 'bi bi-plus-circle-fill'}></i>
                                                <span>{postoEditando ? 'Salvar' : 'Cadastrar'}</span>
                                            </button>
                                            {postoEditando && (
                                                <button
                                                    type="button"
                                                    onClick={cancelarEdicao}
                                                    className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                                                >
                                                    <i className="bi bi-x-circle"></i>
                                                    <span>Cancelar</span>
                                                </button>
                                            )}
                                        </div>
                                    </form>
                                ) : (
                                    <div>
                                        {/* Cabeçalho dentro de um container */}
                                        <div className="px-4 py-2 bg-blue-50 rounded-md mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className="w-8" />
                                                <div className="grid grid-cols-4 items-center w-full gap-4">
                                                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide col-span-1">
                                                        Posto
                                                    </span>
                                                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide text-center col-span-1">
                                                        Linha/Sublinha
                                                    </span>
                                                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide text-center col-span-1">
                                                        RFID
                                                    </span>
                                                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide text-right pr-8 col-span-1">
                                                        Data Criação
                                                    </span>
                                                </div>
                                                <div className="w-24" />
                                            </div>
                                        </div>
                                        {carregando ? (
                                            <div className="flex justify-center items-center py-12">
                                                <p className="text-gray-500">Carregando postos...</p>
                                            </div>
                                        ) : postos.length > 0 ? (
                                            <div className="space-y-3">
                                                {postosPaginaAtual.map((posto) => {
                                                    const dispositivo = totens.find(t => t.id === posto.toten_id)
                                                    return (
                                                        <div key={posto.posto_id} className="flex items-center justify-between bg-white border border-gray-200 rounded-md px-4 py-3 hover:bg-gray-50 transition-colors">
                                                            <div className="flex items-center gap-3 w-full">
                                                                <span className="w-8 text-gray-400">
                                                                    <i className="bi bi-geo-alt-fill"></i>
                                                                </span>
                                                                <div className="grid grid-cols-4 items-center w-full gap-4">
                                                                    <div className="col-span-1">
                                                                        <span className="text-sm font-medium text-gray-900">{posto.nome}</span>
                                                                    </div>
                                                                    <div className="col-span-1 text-center">
                                                                        <span className="text-sm text-gray-700">{obterNomeSublinha(posto.sublinha_id)}</span>
                                                                    </div>
                                                                    <div className="col-span-1 text-center">
                                                                        <span className="text-sm text-gray-700">
                                                                            {dispositivo ? `${dispositivo.nome}${dispositivo.serial ? ` (${dispositivo.serial})` : ''}` : '-'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="col-span-1 text-right pr-8">
                                                                        <span className="text-sm text-gray-500">
                                                                            {posto.data_criacao ? new Date(posto.data_criacao).toLocaleDateString('pt-BR') : '-'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 w-24 justify-end">
                                                                <button
                                                                    onClick={() => handleEditarPosto(posto)}
                                                                    className="p-2 rounded transition-colors hover:opacity-80"
                                                                    style={{ color: 'var(--bg-azul)' }}
                                                                    title="Editar posto"
                                                                >
                                                                    <i className="bi bi-pencil"></i>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleExcluirPosto(posto)}
                                                                    className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors"
                                                                    title="Excluir posto"
                                                                >
                                                                    <i className="bi bi-trash"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                                {postos.length > itensPorPagina && (
                                                    <Paginacao
                                                        totalItens={postos.length}
                                                        itensPorPagina={itensPorPagina}
                                                        paginaAtual={paginaAtual}
                                                        onPageChange={setPaginaAtual}
                                                    />
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-12">
                                                <i className="bi bi-info-circle text-gray-300 text-5xl mb-4"></i>
                                                <p className="text-gray-500 text-lg font-medium">
                                                    Nenhum posto cadastrado
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
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
