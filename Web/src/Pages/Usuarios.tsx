import React, { useState, useEffect, useMemo } from 'react'
import TopBar from '../Components/topBar/TopBar'
import MenuLateral from '../Components/MenuLateral/MenuLateral'
import { fetchAPI } from '../api/api'
import ModalConfirmacao from '../Components/Compartilhados/ModalConfirmacao'
import ModalEditarUsuario from '../Components/Usuarios/ModalEditarUsuario'
import ModalSucesso from '../Components/Modais/ModalSucesso'
import ModalErro from '../Components/Modais/ModalErro'
import { Paginacao } from '../Components/Compartilhados/paginacao'

interface Usuario {
    id: number
    username: string
    nome: string
    role: 'admin' | 'master'
    ativo: boolean
    data_criacao?: string
}

const Usuarios = () => {
    const [abaAtiva, setAbaAtiva] = useState<'cadastrar' | 'listar'>('listar')
    const [username, setUsername] = useState('')
    const [nome, setNome] = useState('')
    const [senha, setSenha] = useState('')
    const [role, setRole] = useState<'admin' | 'master'>('admin')
    const [ativo, setAtivo] = useState(true)
    const [usuarios, setUsuarios] = useState<Usuario[]>([])
    const [carregando, setCarregando] = useState(false)
    const [modalEditarAberto, setModalEditarAberto] = useState(false)
    const [modalExcluirAberto, setModalExcluirAberto] = useState(false)
    const [modalStatusAberto, setModalStatusAberto] = useState(false)
    const [modalSucessoAberto, setModalSucessoAberto] = useState(false)
    const [modalErroAberto, setModalErroAberto] = useState(false)
    const [mensagemSucesso, setMensagemSucesso] = useState('')
    const [mensagemErro, setMensagemErro] = useState('')
    const [tituloErro, setTituloErro] = useState('Erro!')
    const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null)
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [itensPorPagina] = useState(10)
    const [filtroUsername, setFiltroUsername] = useState('')
    const [filtroNome, setFiltroNome] = useState('')
    const [filtroRole, setFiltroRole] = useState('')

    const fecharModal = () => {
        setModalEditarAberto(false)
        setModalExcluirAberto(false)
        setModalStatusAberto(false)
        setUsuarioSelecionado(null)
    }

    useEffect(() => {
        if (abaAtiva === 'listar') {
            carregarUsuarios()
        }
    }, [abaAtiva])

    const carregarUsuarios = async () => {
        setCarregando(true)
        try {
            const data = await fetchAPI('/usuarios/')
            setUsuarios(data)
        } catch (error: any) {
            setTituloErro('Erro!')
            setMensagemErro(error?.message || 'Erro ao carregar usuários')
            setModalErroAberto(true)
        } finally {
            setCarregando(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await handleConfirmarCadastro()
    }

    const handleConfirmarCadastro = async () => {
        try {
            await fetchAPI('/usuarios/', {
                method: 'POST',
                body: JSON.stringify({ username, nome, senha, role, ativo }),
            })
            setMensagemSucesso('Usuário cadastrado com sucesso!')
            setModalSucessoAberto(true)
            setUsername('')
            setNome('')
            setSenha('')
            setRole('admin')
            setAtivo(true)
        } catch (error: any) {
            setTituloErro('Erro!')
            setMensagemErro(error?.message || 'Erro ao cadastrar usuário')
            setModalErroAberto(true)
        } finally {
            fecharModal()
        }
    }

    const handleEditarUsuario = (usuario: Usuario) => {
        setUsuarioSelecionado(usuario)
        setModalEditarAberto(true)
    }

    const handleSalvarEdicao = async (dados: any) => {
        if (!usuarioSelecionado) return

        const usuarioId = usuarioSelecionado.id
        if (!usuarioId) {
            setTituloErro('Erro!')
            setMensagemErro('Erro: ID do usuário não encontrado')
            setModalErroAberto(true)
            return
        }

        try {
            await fetchAPI(`/usuarios/${usuarioId}`, {
                method: 'PUT',
                body: JSON.stringify(dados),
            })
            setMensagemSucesso('Usuário atualizado com sucesso!')
            setModalSucessoAberto(true)
            carregarUsuarios()
        } catch (error: any) {
            setTituloErro('Erro!')
            setMensagemErro(error?.message || 'Erro ao atualizar usuário')
            setModalErroAberto(true)
        } finally {
            fecharModal()
        }
    }

    const handleExcluirUsuario = (usuario: Usuario) => {
        setUsuarioSelecionado(usuario)
        setModalExcluirAberto(true)
    }

    const handleAbrirModalStatus = (usuario: Usuario) => {
        setUsuarioSelecionado(usuario)
        setModalStatusAberto(true)
    }

    const handleConfirmarExclusao = async () => {
        if (!usuarioSelecionado) return

        const usuarioId = usuarioSelecionado.id
        if (!usuarioId) {
            setTituloErro('Erro!')
            setMensagemErro('Erro: ID do usuário não encontrado')
            setModalErroAberto(true)
            fecharModal()
            return
        }

        try {
            await fetchAPI(`/usuarios/${usuarioId}`, { method: 'DELETE' })
            setMensagemSucesso('Usuário excluído com sucesso!')
            setModalSucessoAberto(true)
            carregarUsuarios()
        } catch (error: any) {
            setTituloErro('Erro!')
            setMensagemErro(error?.message || 'Erro ao excluir usuário')
            setModalErroAberto(true)
        } finally {
            fecharModal()
        }
    }

    const handleConfirmarMudancaStatus = async () => {
        if (!usuarioSelecionado) return

        const usuarioId = usuarioSelecionado.id
        if (!usuarioId) {
            setTituloErro('Erro!')
            setMensagemErro('Erro: ID do usuário não encontrado')
            setModalErroAberto(true)
            fecharModal()
            return
        }

        try {
            await fetchAPI(`/usuarios/${usuarioId}`, {
                method: 'PUT',
                body: JSON.stringify({ ativo: !usuarioSelecionado.ativo }),
            })
            setMensagemSucesso(`Usuário ${!usuarioSelecionado.ativo ? 'ativado' : 'desativado'} com sucesso!`)
            setModalSucessoAberto(true)
            carregarUsuarios()
        } catch (error: any) {
            setTituloErro('Erro!')
            setMensagemErro(error?.message || 'Erro ao alterar status do usuário')
            setModalErroAberto(true)
        } finally {
            fecharModal()
        }
    }

    const usuariosFiltrados = useMemo(() => {
        return usuarios.filter((u) => {
            const matchUsername = !filtroUsername || u.username.toLowerCase().includes(filtroUsername.toLowerCase())
            const matchNome = !filtroNome || u.nome.toLowerCase().includes(filtroNome.toLowerCase())
            const matchRole = !filtroRole || u.role === filtroRole
            return matchUsername && matchNome && matchRole
        })
    }, [usuarios, filtroUsername, filtroNome, filtroRole])

    const temFiltros = Boolean(filtroUsername || filtroNome || filtroRole)

    const indiceInicio = (paginaAtual - 1) * itensPorPagina
    const usuariosPaginaAtual = usuariosFiltrados.slice(indiceInicio, indiceInicio + itensPorPagina)

    useEffect(() => {
        setPaginaAtual(1)
    }, [filtroUsername, filtroNome, filtroRole])

    useEffect(() => {
        const totalPaginas = Math.ceil(usuariosFiltrados.length / itensPorPagina)
        if (paginaAtual > totalPaginas && totalPaginas > 0) {
            setPaginaAtual(totalPaginas)
        }
    }, [usuariosFiltrados.length, itensPorPagina, paginaAtual])

    const getRoleLabel = (role: string) => {
        const labels: { [key: string]: string } = {
            'admin': 'Administrador',
            'master': 'Master'
        }
        return labels[role] || role
    }

    const getRoleColor = (role: string) => {
        const colors: { [key: string]: string } = {
            'admin': 'bg-blue-100 text-blue-800',
            'master': 'bg-purple-100 text-purple-800'
        }
        return colors[role] || 'bg-gray-100 text-gray-800'
    }

    const formatarDataCriacao = (data?: string) => {
        if (!data) return '-'
        const dt = new Date(data)
        if (Number.isNaN(dt.getTime())) return '-'
        return dt.toLocaleDateString('pt-BR')
    }

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
                                            {aba === 'cadastrar' ? 'Cadastrar Usuário' : 'Listar Usuários'}
                                        </button>
                                    ))}
                                </div>

                                <div className="p-6">
                                    <form onSubmit={handleSubmit}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Username <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    required
                                                    placeholder='Ex: joao.silva'
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Nome <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type='text'
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    required
                                                    placeholder='Ex: João Silva'
                                                    value={nome}
                                                    onChange={(e) => setNome(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Senha <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="password"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    required
                                                    placeholder='Digite a senha'
                                                    value={senha}
                                                    onChange={(e) => setSenha(e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Tipo de Usuário
                                                </label>
                                                <select
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    value={role}
                                                    onChange={(e) => setRole(e.target.value as 'admin' | 'master')}
                                                >
                                                    <option value="admin">Administrador</option>
                                                    <option value="master">Master</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type='checkbox'
                                                    checked={ativo}
                                                    onChange={(e) => setAtivo(e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <span className="text-sm font-medium text-gray-700">Usuário Ativo</span>
                                            </label>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                type='submit'
                                                className="flex items-center gap-2 px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                                                style={{ backgroundColor: 'var(--bg-azul)' }}
                                                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                            >
                                                <i className="bi bi-person-plus-fill"></i>
                                                <span>Cadastrar Usuário</span>
                                            </button>
                                        </div>
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
                                            {aba === 'cadastrar' ? 'Cadastrar Usuário' : 'Listar Usuários'}
                                        </button>
                                    ))}
                                </div>

                                {/* Filtros + Tabela */}
                                <div className="mt-4">
                                    {usuarios.length > 0 && (
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
                                                                setFiltroUsername('')
                                                                setFiltroNome('')
                                                                setFiltroRole('')
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
                                                            Username
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            placeholder="Buscar por username..."
                                                            value={filtroUsername}
                                                            onChange={(e) => setFiltroUsername(e.target.value)}
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

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Tipo
                                                        </label>
                                                        <select
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            value={filtroRole}
                                                            onChange={(e) => setFiltroRole(e.target.value)}
                                                        >
                                                            <option value="">Todos</option>
                                                            <option value="admin">Administrador</option>
                                                            <option value="master">Master</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {carregando && usuarios.length === 0 ? (
                                        <div className="flex justify-center items-center py-12">
                                            <p className="text-gray-500">Carregando usuários...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr style={{ backgroundColor: 'var(--bg-azul)' }}>
                                                            <th className="sticky top-0 z-10 px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider" style={{ backgroundColor: 'var(--bg-azul)' }}>Username</th>
                                                            <th className="sticky top-0 z-10 px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider" style={{ backgroundColor: 'var(--bg-azul)' }}>Nome</th>
                                                            <th className="sticky top-0 z-10 px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider" style={{ backgroundColor: 'var(--bg-azul)' }}>Tipo</th>
                                                            <th className="sticky top-0 z-10 px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider" style={{ backgroundColor: 'var(--bg-azul)' }}>Data Criação</th>
                                                            <th className="sticky top-0 z-10 px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider" style={{ backgroundColor: 'var(--bg-azul)' }}>Status</th>
                                                            <th className="sticky top-0 z-10 px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider" style={{ backgroundColor: 'var(--bg-azul)' }}>Ações</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200">
                                                        {usuariosFiltrados.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={6} className="px-6 py-12">
                                                                    <div className="flex flex-col items-center justify-center">
                                                                        <i className="bi bi-inbox text-gray-300 text-5xl mb-4"></i>
                                                                        <p className="text-gray-500 text-lg font-medium text-center">
                                                                            {temFiltros
                                                                                ? 'Nenhum usuário encontrado com os filtros aplicados'
                                                                                : 'Nenhum usuário cadastrado'}
                                                                        </p>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            usuariosPaginaAtual.map((usuario) => (
                                                                <tr key={usuario.id} className="hover:bg-gray-50">
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{usuario.username}</td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{usuario.nome}</td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(usuario.role)}`}>
                                                                            {getRoleLabel(usuario.role)}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatarDataCriacao(usuario.data_criacao)}</td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${usuario.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                            {usuario.ativo ? 'Ativo' : 'Inativo'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                        <div className="flex items-center justify-center gap-2">
                                                                            <button
                                                                                onClick={() => handleEditarUsuario(usuario)}
                                                                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                                                                title="Editar usuário"
                                                                            >
                                                                                <i className="bi bi-pencil-square"></i>
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleAbrirModalStatus(usuario)}
                                                                                className={`transition-colors hover:opacity-80 ${usuario.ativo ? 'text-orange-600' : 'text-green-600'}`}
                                                                                title={usuario.ativo ? 'Desativar usuário' : 'Ativar usuário'}
                                                                            >
                                                                                <i className={`bi ${usuario.ativo ? 'bi-toggle-on' : 'bi-toggle-off'}`}></i>
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleExcluirUsuario(usuario)}
                                                                                className="text-red-600 hover:text-red-800 transition-colors"
                                                                                title="Excluir usuário"
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

                                            {usuariosFiltrados.length > itensPorPagina && (
                                                <Paginacao
                                                    totalItens={usuariosFiltrados.length}
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

            <ModalEditarUsuario
                isOpen={modalEditarAberto}
                onClose={fecharModal}
                onSave={handleSalvarEdicao}
                usuarioEditando={usuarioSelecionado}
            />

            <ModalConfirmacao
                isOpen={modalExcluirAberto}
                onClose={fecharModal}
                onConfirm={handleConfirmarExclusao}
                titulo="Excluir Usuário"
                mensagem="Tem certeza que deseja excluir este usuário?"
                textoConfirmar="Excluir"
                textoCancelar="Cancelar"
                corHeader="vermelho"
            />

            <ModalConfirmacao
                isOpen={modalStatusAberto}
                onClose={fecharModal}
                onConfirm={handleConfirmarMudancaStatus}
                titulo={usuarioSelecionado?.ativo ? 'Desativar' : 'Ativar'}
                mensagem={usuarioSelecionado?.ativo ? 'Deseja desativar esse usuário?' : 'Deseja ativar esse usuário?'}
                textoConfirmar="Confirmar"
                textoCancelar="Cancelar"
                corHeader={usuarioSelecionado?.ativo ? 'vermelho' : 'verde'}
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

export default Usuarios

