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
    const [carregandoTurnos, setCarregandoTurnos] = useState(true)
    const [salvandoFuncionario, setSalvandoFuncionario] = useState(false)
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
    const [filtroTag, setFiltroTag] = useState('')
    const [filtroMatricula, setFiltroMatricula] = useState('')
    const [filtroNome, setFiltroNome] = useState('')
    const rfidInputRef = useRef<HTMLInputElement>(null)
    const carregamentoInicialExecutadoRef = useRef(false)

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

    const carregarFuncionarios = async () => {
        setCarregando(true)
        setCarregandoTurnos(true)
        try {
            let turnosApi = await listarTurnos()
            if (turnosApi.length > 0) {
                setTurnosDisponiveis(turnosApi.sort((a, b) => a.id - b.id))
            } else {
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

            if (mapa.size > 0 && turnosApi.length === 0) {
                setTurnosDisponiveis(Array.from(mapa.values()).sort((a, b) => a.id - b.id))
            }

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
            setCarregandoTurnos(false)
        }
    }

    useEffect(() => {
        if (carregamentoInicialExecutadoRef.current) return
        carregamentoInicialExecutadoRef.current = true
        carregarFuncionarios()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!tag.trim()) return mostrarErro('Atenção!', 'A Tag RFID é obrigatória.')
        if (!matricula.trim()) return mostrarErro('Atenção!', 'A matrícula é obrigatória.')
        if (!nome.trim()) return mostrarErro('Atenção!', 'O nome é obrigatório.')
        if (turnosSelecionados.length === 0) return mostrarErro('Atenção!', 'Selecione pelo menos um turno.')

        // Validação simples no cliente para evitar duplicidade imediata
        const tagNormalizada = tag.trim()
        const jaExiste = funcionarios.some(f => f.tag === tagNormalizada || f.matricula === matricula)
        if (jaExiste) {
            return mostrarErro('Atenção!', 'Já existe um funcionário com a mesma Tag ou Matrícula.')
        }

        try {
            setSalvandoFuncionario(true)
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
        } finally {
            setSalvandoFuncionario(false)
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

    const funcionariosFiltrados = funcionarios.filter((func) => {
        const matchTag = !filtroTag || func.tag.toLowerCase().includes(filtroTag.toLowerCase())
        const matchMatricula = !filtroMatricula || func.matricula.toLowerCase().includes(filtroMatricula.toLowerCase())
        const matchNome = !filtroNome || func.nome.toLowerCase().includes(filtroNome.toLowerCase())
        return matchTag && matchMatricula && matchNome
    })

    const temFiltros = filtroTag || filtroMatricula || filtroNome
    const formularioCadastroInvalido =
        salvandoFuncionario ||
        carregandoTurnos ||
        !tag.trim() ||
        !matricula.trim() ||
        !nome.trim() ||
        turnosSelecionados.length === 0

    const indiceInicio = (paginaAtual - 1) * itensPorPagina
    const funcionariosPaginaAtual = funcionariosFiltrados.slice(indiceInicio, indiceInicio + itensPorPagina)

    useEffect(() => {
        setPaginaAtual(1)
    }, [filtroTag, filtroMatricula, filtroNome])

    useEffect(() => {
        const totalPaginas = Math.ceil(funcionariosFiltrados.length / itensPorPagina)
        if (paginaAtual > totalPaginas && totalPaginas > 0) setPaginaAtual(totalPaginas)
    }, [funcionarios.length, paginaAtual])

    return (
        <div className="flex min-h-screen bg-gray-50">
            <MenuLateral />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <div className="flex-1 p-6 pt-32 pb-20 md:pb-24 md:pl-20 transition-all duration-300">
                    <div className="max-w-[95%] mx-auto">
                        {abaAtiva === 'cadastrar' ? (
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
                                            {carregandoTurnos ? (
                                                <p className="text-sm text-gray-500 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                                                    Carregando turnos...
                                                </p>
                                            ) : turnosDisponiveis.length > 0 ? (
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
                                            <span>{salvandoFuncionario ? 'Salvando...' : 'Cadastrar'}</span>
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Abas fora do container branco */}
                                <div className="flex border-b border-gray-200 bg-white rounded-t-lg shadow-md">
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

                                {/* Tabela fora do container das abas */}
                                <div className="mt-4">
                                    {funcionarios.length > 0 && (
                                        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
                                            <div className="p-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                                        <i className="bi bi-funnel"></i>
                                                        Filtros de Busca
                                                    </h4>
                                                    {temFiltros && (
                                                        <button
                                                            onClick={() => {
                                                                setFiltroTag('')
                                                                setFiltroMatricula('')
                                                                setFiltroNome('')
                                                            }}
                                                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                        >
                                                            <i className="bi bi-x-circle"></i>
                                                            Limpar Filtros
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Tag
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            placeholder="Buscar por tag..."
                                                            value={filtroTag}
                                                            onChange={(e) => setFiltroTag(e.target.value)}
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Matrícula
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            placeholder="Buscar por matrícula..."
                                                            value={filtroMatricula}
                                                            onChange={(e) => setFiltroMatricula(e.target.value)}
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Nome
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            placeholder="Buscar por nome..."
                                                            value={filtroNome}
                                                            onChange={(e) => setFiltroNome(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                        {carregando && funcionarios.length === 0 ? (
                                            <div className="flex justify-center items-center py-12">
                                                <p className="text-gray-500">Carregando funcionários...</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="bg-white rounded-lg shadow-md overflow-hidden mt-0">
                                                    <table className="w-full">
                                                        <thead>
                                                            <tr style={{ backgroundColor: 'var(--bg-azul)' }}>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Tag</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Matrícula</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Nome</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Turno</th>
                                                                <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Status</th>
                                                                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Data Criação</th>
                                                                <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Ações</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {funcionariosFiltrados.length === 0 ? (
                                                                <tr>
                                                                    <td colSpan={7} className="px-6 py-12">
                                                                        <div className="flex flex-col items-center justify-center">
                                                                            <i className="bi bi-inbox text-gray-300 text-5xl mb-4"></i>
                                                                            <p className="text-gray-500 text-lg font-medium text-center">
                                                                                {temFiltros
                                                                                    ? 'Nenhum funcionário encontrado com os filtros aplicados'
                                                                                    : 'Nenhum funcionário cadastrado'}
                                                                            </p>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ) : (
                                                                funcionariosPaginaAtual.map((funcionario) => (
                                                                    <tr key={funcionario.id} className="hover:bg-gray-50">
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{funcionario.tag || '-'}</td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{funcionario.matricula}</td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{funcionario.nome}</td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                                            {funcionario.turnos && funcionario.turnos.length > 0
                                                                                ? funcionario.turnos.map(t => t.nome).join(', ')
                                                                                : 'Não definido'}
                                                                        </td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${funcionario.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                                {funcionario.ativo ? 'Ativo' : 'Inativo'}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                            {funcionario.data_criacao ? new Date(funcionario.data_criacao).toLocaleDateString('pt-BR') : '-'}
                                                                        </td>
                                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                            <div className="flex items-center justify-center gap-2">
                                                                                <button
                                                                                    onClick={() => { setFuncionarioSelecionado(funcionario); setModalEditarAberto(true) }}
                                                                                    className="text-blue-600 hover:text-blue-800 transition-colors"
                                                                                    title="Editar funcionário"
                                                                                >
                                                                                    <i className="bi bi-pencil-square"></i>
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => { setFuncionarioSelecionado(funcionario); setModalStatusAberto(true) }}
                                                                                    className={`transition-colors hover:opacity-80 ${funcionario.ativo ? 'text-orange-600' : 'text-green-600'}`}
                                                                                    title={funcionario.ativo ? 'Desativar' : 'Ativar'}
                                                                                >
                                                                                    <i className={`bi ${funcionario.ativo ? 'bi-toggle-on' : 'bi-toggle-off'}`}></i>
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => { setFuncionarioSelecionado(funcionario); setModalExcluirAberto(true) }}
                                                                                    className="text-red-600 hover:text-red-800 transition-colors"
                                                                                    title="Excluir funcionário"
                                                                                >
                                                                                    <i className="bi bi-trash"></i>
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {funcionariosFiltrados.length > itensPorPagina && (
                                                    <Paginacao
                                                        totalItens={funcionariosFiltrados.length}
                                                        itensPorPagina={itensPorPagina}
                                                        paginaAtual={paginaAtual}
                                                        onPageChange={setPaginaAtual}
                                                    />
                                                )}
                                            </>
                                        )}
                                </div>
                            </>
                        )}
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
