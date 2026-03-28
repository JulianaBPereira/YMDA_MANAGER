import React, { useState, useRef, useEffect } from 'react'
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'
import ModalEditarFuncionario from '../Components/Funcionarios/ModalEditarFuncionario'
import ModalConfirmacao from '../Components/Compartilhados/ModalConfirmacao'
import ModalSucesso from '../Components/Modais/ModalSucesso'
import ModalErro from '../Components/Modais/ModalErro'
import { Paginacao } from '../Components/Compartilhados/paginacao'
import {
    type Funcionario,
    type Turno,
    type AtualizarFuncionarioData,
    listarFuncionarios,
    listarTurnos,
    garantirTurnosPadrao,
    criarFuncionario,
    atualizarFuncionario,
    deletarFuncionario,
} from '../services/funcionarios'

const itensPorPagina = 10

const Funcionarios = () => {
    const [abaAtiva, setAbaAtiva] = useState<'cadastrar' | 'listar'>('cadastrar')
    const [matricula, setMatricula] = useState('')
    const [nome, setNome] = useState('')
    const [tag, setTag] = useState('')
    const [ativo, setAtivo] = useState(true)
    const [turnosSelecionados, setTurnosSelecionados] = useState<number[]>([])
    const [turnosDisponiveis, setTurnosDisponiveis] = useState<Turno[]>([])
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
    const [carregando, setCarregando] = useState(false)
    const [modalEditarAberto, setModalEditarAberto] = useState(false)
    const [modalExcluirAberto, setModalExcluirAberto] = useState(false)
    const [modalStatusAberto, setModalStatusAberto] = useState(false)
    const [modalSucessoAberto, setModalSucessoAberto] = useState(false)
    const [modalErroAberto, setModalErroAberto] = useState(false)
    const [mensagemSucesso, setMensagemSucesso] = useState('')
    const [mensagemErro, setMensagemErro] = useState('')
    const [tituloErro, setTituloErro] = useState('Erro!')
    const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<Funcionario | null>(null)
    const [paginaAtual, setPaginaAtual] = useState(1)
    const rfidInputRef = useRef<HTMLInputElement>(null)

    const fecharModal = () => {
        setModalEditarAberto(false)
        setModalExcluirAberto(false)
        setModalStatusAberto(false)
        setFuncionarioSelecionado(null)
    }

    const mostrarErro = (titulo: string, mensagem: string) => {
        setTituloErro(titulo)
        setMensagemErro(mensagem)
        setModalErroAberto(true)
    }

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const el = document.activeElement
            const isInput = el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA'
            if (!isInput && rfidInputRef.current && (e.key.length === 1 || e.key === 'Enter')) {
                rfidInputRef.current.focus()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Carrega funcionários (e aproveita para extrair turnos disponíveis)
    const carregarFuncionarios = async () => {
        setCarregando(true)
        try {
            // 1) Tenta carregar turnos por endpoint dedicado (se o backend fornecer)
            let turnosApi = await listarTurnos()
            if (turnosApi.length > 0) {
                setTurnosDisponiveis(turnosApi.sort((a, b) => a.id - b.id))
            } else {
                // 1.b) Se não houver nenhum turno, cria os turnos padrão automaticamente
                turnosApi = await garantirTurnosPadrao()
                if (turnosApi.length > 0) {
                    setTurnosDisponiveis(turnosApi.sort((a, b) => a.id - b.id))
                }
            }

            const dados = await listarFuncionarios()
            setFuncionarios(dados)
            const mapa = new Map<number, Turno>()
            for (const f of dados) {
                for (const t of f.turnos) {
                    if (!mapa.has(t.id)) mapa.set(t.id, t)
                }
            }
            // 2) Fallback: se não veio nada da API de turnos, extrai dos funcionários
            if (mapa.size > 0 && turnosApi.length === 0) {
                setTurnosDisponiveis(Array.from(mapa.values()).sort((a, b) => a.id - b.id))
            }

            // 3) Último recurso: se ainda não houver turnos, mostrar opções padrão no formulário
            if (turnosApi.length === 0 && mapa.size === 0) {
                setTurnosDisponiveis([
                    { id: 1, nome: 'Matutino' },
                    { id: 2, nome: 'Vespertino' },
                    { id: 3, nome: 'Noturno' },
                ])
            }
        } catch (error: any) {
            mostrarErro('Erro!', `Erro ao carregar funcionários: ${error?.message || 'Erro desconhecido'}`)
            setFuncionarios([])
        } finally {
            setCarregando(false)
        }
    }

    // Carrega no mount (para ter turnos disponíveis no formulário) e ao entrar na aba listar
    useEffect(() => { carregarFuncionarios() }, [])
    useEffect(() => { if (abaAtiva === 'listar') carregarFuncionarios() }, [abaAtiva])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!tag.trim()) return mostrarErro('Atenção!', 'A Tag RFID é obrigatória.')
        if (turnosSelecionados.length === 0) return mostrarErro('Atenção!', 'Selecione pelo menos um turno.')

        // Validação simples no cliente para evitar duplicidade imediata
        const tagNormalizada = tag.trim()
        const jaExiste = funcionarios.some(f => f.tag === tagNormalizada || f.matricula === matricula)
        if (jaExiste) {
            return mostrarErro('Atenção!', 'Já existe um funcionário com a mesma Tag ou Matrícula.')
        }

        try {
            const criado = await criarFuncionario({ tag: tagNormalizada, matricula, nome, ativo, turno_ids: turnosSelecionados })

            // Workaround: alguns backends podem ignorar turno_ids no POST.
            // Se voltar sem turnos, tentamos atualizar em seguida para garantir a associação.
            if (Array.isArray(criado?.turnos) ? criado.turnos.length === 0 : true) {
                await atualizarFuncionario(criado.id, {
                    tag: tagNormalizada,
                    matricula,
                    nome,
                    ativo,
                    turno_ids: turnosSelecionados,
                })
            }

            setMatricula(''); setNome(''); setTag(''); setAtivo(true); setTurnosSelecionados([])
            if (abaAtiva === 'listar') await carregarFuncionarios()
            setTimeout(() => rfidInputRef.current?.focus(), 100)
            setMensagemSucesso('Funcionário cadastrado com sucesso!')
            setModalSucessoAberto(true)
        } catch (error: any) {
            mostrarErro('Erro!', `Erro ao cadastrar funcionário: ${error?.message || 'Erro desconhecido'}`)
        }
    }

    const handleSalvarEdicao = async (dados: AtualizarFuncionarioData) => {
        if (!funcionarioSelecionado) return
        try {
            await atualizarFuncionario(funcionarioSelecionado.id, dados)
            await carregarFuncionarios()
            setModalEditarAberto(false)
            setMensagemSucesso('Funcionário atualizado com sucesso!')
            setModalSucessoAberto(true)
        } catch (error: any) {
            mostrarErro('Erro!', `Erro ao atualizar funcionário: ${error?.message || 'Erro desconhecido'}`)
        }
    }

    const handleConfirmarExclusao = async () => {
        if (!funcionarioSelecionado) return
        try {
            await deletarFuncionario(funcionarioSelecionado.id)
            await carregarFuncionarios()
            fecharModal()
            setMensagemSucesso('Funcionário excluído com sucesso!')
            setModalSucessoAberto(true)
        } catch (error: any) {
            mostrarErro('Erro!', `Erro ao excluir funcionário: ${error?.message || 'Erro desconhecido'}`)
        }
    }

    const handleConfirmarMudancaStatus = async () => {
        if (!funcionarioSelecionado) return
        try {
            const novoStatus = !funcionarioSelecionado.ativo
            await atualizarFuncionario(funcionarioSelecionado.id, {
                tag: funcionarioSelecionado.tag,
                matricula: funcionarioSelecionado.matricula,
                nome: funcionarioSelecionado.nome,
                ativo: novoStatus,
                turno_ids: funcionarioSelecionado.turnos.map(t => t.id),
            })
            await carregarFuncionarios()
            fecharModal()
            setMensagemSucesso(`Funcionário ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`)
            setModalSucessoAberto(true)
        } catch (error: any) {
            mostrarErro('Erro!', `Erro ao alterar status: ${error?.message || 'Erro desconhecido'}`)
        }
    }

    const indiceInicio = (paginaAtual - 1) * itensPorPagina
    const funcionariosPaginaAtual = funcionarios.slice(indiceInicio, indiceInicio + itensPorPagina)

    useEffect(() => {
        const totalPaginas = Math.ceil(funcionarios.length / itensPorPagina)
        if (paginaAtual > totalPaginas && totalPaginas > 0) setPaginaAtual(totalPaginas)
    }, [funcionarios.length, paginaAtual])

    return (
        <div className="flex min-h-screen bg-gray-50">
            <MenuLateral />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 p-6 pt-32 pb-20 md:pb-24 md:pl-20 transition-all duration-300">
                    <div className="max-w-[95%] mx-auto">
                        <div className="bg-white rounded-lg shadow-md">
                            {/* Abas */}
                            <div className="flex border-b border-gray-200">
                                {(['cadastrar', 'listar'] as const).map((aba) => (
                                    <button
                                        key={aba}
                                        onClick={() => setAbaAtiva(aba)}
                                        className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                                            abaAtiva === aba ? 'text-white border-b-2' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                        style={abaAtiva === aba ? { backgroundColor: 'var(--bg-azul)' } : {}}
                                    >
                                        <i className={`bi ${aba === 'cadastrar' ? 'bi-person-plus-fill' : 'bi-list-ul'} mr-2`}></i>
                                        {aba === 'cadastrar' ? 'Cadastrar Funcionário' : 'Listar Funcionários'}
                                    </button>
                                ))}
                            </div>

                            <div className="p-6">
                                {abaAtiva === 'cadastrar' ? (
                                    <form id="form-funcionario" onSubmit={handleSubmit}>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Tag RFID <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                ref={rfidInputRef}
                                                type="text"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Ex: 123456789"
                                                value={tag}
                                                onChange={(e) => setTag(e.target.value)}
                                                autoFocus autoComplete="off" required
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Matrícula <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    required placeholder="Ex: 12345"
                                                    value={matricula} onChange={(e) => setMatricula(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Nome <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    required placeholder="Ex: João Silva"
                                                    value={nome} onChange={(e) => setNome(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={ativo} onChange={(e) => setAtivo(e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <span className="text-sm font-medium text-gray-700">Funcionário Ativo</span>
                                            </label>
                                        </div>

                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Turnos <span className="text-red-500">*</span>
                                            </label>
                                            {turnosDisponiveis.length > 0 ? (
                                                <div className="flex gap-4 px-3 py-2 border border-gray-300 rounded-md bg-white">
                                                    {turnosDisponiveis.map((turno) => (
                                                        <label key={turno.id} className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={turnosSelecionados.includes(turno.id)}
                                                                onChange={(e) => setTurnosSelecionados(
                                                                    e.target.checked
                                                                        ? [...turnosSelecionados, turno.id]
                                                                        : turnosSelecionados.filter(id => id !== turno.id)
                                                                )}
                                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                            />
                                                            <span className="text-sm text-gray-700 capitalize">{turno.nome}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                                                    Nenhum turno disponível. Cadastre um funcionário com turnos primeiro.
                                                </p>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            className="flex items-center gap-2 px-4 py-2 text-white rounded-md transition-colors"
                                            style={{ backgroundColor: 'var(--bg-azul)' }}
                                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                        >
                                            <i className="bi bi-person-plus-fill"></i>
                                            Cadastrar Funcionário
                                        </button>
                                    </form>
                                ) : (
                                    <div>
                                        {/* Cabeçalho e lista no mesmo layout de Postos */}
                                        {carregando ? (
                                            <div className="flex justify-center items-center py-12">
                                                <p className="text-gray-500">Carregando funcionários...</p>
                                            </div>
                                        ) : funcionarios.length > 0 ? (
                                            <div className="space-y-3">
                                                <div className="px-4 py-2 bg-blue-50 rounded-md mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-8" />
                                                        <div className="grid grid-cols-5 items-center w-full gap-4">
                                                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide col-span-1">
                                                                Funcionário
                                                            </span>
                                                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide text-center col-span-1">
                                                                Matrícula
                                                            </span>
                                                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide text-center col-span-1">
                                                                Turno
                                                            </span>
                                                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide text-center col-span-1">
                                                                RFID
                                                            </span>
                                                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide text-right pr-16 col-span-1">
                                                                Data Criação
                                                            </span>
                                                        </div>
                                                        <div className="w-24" />
                                                    </div>
                                                </div>

                                                {funcionariosPaginaAtual.map((funcionario) => (
                                                    <div key={funcionario.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-md px-4 py-3 hover:bg-gray-50 transition-colors">
                                                        <div className="flex items-center gap-3 w-full">
                                                            <span className="w-8 text-gray-400">
                                                                <i className="bi bi-person-fill"></i>
                                                            </span>
                                                            <div className="grid grid-cols-5 items-center w-full gap-4">
                                                                <div className="col-span-1">
                                                                    <span className="text-sm font-medium text-gray-900">{funcionario.nome}</span>
                                                                </div>
                                                                <div className="col-span-1 text-center">
                                                                    <span className="text-sm text-gray-700">{funcionario.matricula}</span>
                                                                </div>
                                                                <div className="col-span-1 text-center">
                                                                    <span className="text-sm text-gray-700">
                                                                        {funcionario.turnos && funcionario.turnos.length > 0
                                                                            ? funcionario.turnos.map(t => t.nome).join(', ')
                                                                            : 'Não definido'}
                                                                    </span>
                                                                </div>
                                                                <div className="col-span-1 text-center">
                                                                    <span className="text-sm text-gray-700">{funcionario.tag || '-'}</span>
                                                                </div>
                                                                <div className="col-span-1 text-right pr-16">
                                                                    <span className="text-sm text-gray-500">
                                                                        {funcionario.data_criacao ? new Date(funcionario.data_criacao).toLocaleDateString('pt-BR') : '-'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 w-24 justify-end">
                                                            <button
                                                                onClick={() => { setFuncionarioSelecionado(funcionario); setModalEditarAberto(true) }}
                                                                className="p-2 rounded transition-colors hover:opacity-80"
                                                                style={{ color: 'var(--bg-azul)' }}
                                                                title="Editar funcionário"
                                                            >
                                                                <i className="bi bi-pencil"></i>
                                                            </button>
                                                            <button
                                                                onClick={() => { setFuncionarioSelecionado(funcionario); setModalStatusAberto(true) }}
                                                                className={`p-2 rounded transition-colors hover:opacity-80 ${funcionario.ativo ? 'text-orange-600' : 'text-green-600'}`}
                                                                title={funcionario.ativo ? 'Desativar' : 'Ativar'}
                                                            >
                                                                <i className={`bi ${funcionario.ativo ? 'bi-toggle-on' : 'bi-toggle-off'}`}></i>
                                                            </button>
                                                            <button
                                                                onClick={() => { setFuncionarioSelecionado(funcionario); setModalExcluirAberto(true) }}
                                                                className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors"
                                                                title="Excluir funcionário"
                                                            >
                                                                <i className="bi bi-trash"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}

                                                {funcionarios.length > itensPorPagina && (
                                                    <Paginacao
                                                        totalItens={funcionarios.length}
                                                        itensPorPagina={itensPorPagina}
                                                        paginaAtual={paginaAtual}
                                                        onPageChange={setPaginaAtual}
                                                    />
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-12">
                                                <i className="bi bi-info-circle text-gray-300 text-5xl mb-4"></i>
                                                <p className="text-gray-500 text-lg font-medium">Nenhum funcionário cadastrado</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ModalEditarFuncionario
                isOpen={modalEditarAberto}
                onClose={fecharModal}
                onSave={handleSalvarEdicao}
                funcionarioEditando={funcionarioSelecionado}
                turnosDisponiveis={turnosDisponiveis}
            />

            <ModalConfirmacao
                isOpen={modalExcluirAberto}
                onClose={fecharModal}
                onConfirm={handleConfirmarExclusao}
                titulo="Excluir Funcionário"
                mensagem="Tem certeza que deseja excluir este funcionário?"
                textoConfirmar="Excluir"
                textoCancelar="Cancelar"
                corHeader="vermelho"
            />

            <ModalConfirmacao
                isOpen={modalStatusAberto}
                onClose={fecharModal}
                onConfirm={handleConfirmarMudancaStatus}
                titulo={funcionarioSelecionado?.ativo ? 'Desativar' : 'Ativar'}
                mensagem={funcionarioSelecionado?.ativo ? 'Deseja desativar esse funcionário?' : 'Deseja ativar esse funcionário?'}
                textoConfirmar="Confirmar"
                textoCancelar="Cancelar"
                corHeader={funcionarioSelecionado?.ativo ? 'vermelho' : 'verde'}
                item={undefined}
                mostrarDetalhes={false}
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

export default Funcionarios
