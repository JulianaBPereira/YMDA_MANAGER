import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { clearStoredUser, getStoredUser } from '../utils/authStorage';

const LoginAdmin = () => {
  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { login, user, isAdmin, isMaster } = useAuth();
  const navigate = useNavigate();

  // Só entra direto no painel se ainda houver sessão válida de admin/master
  useEffect(() => {
    const stored = getStoredUser();
    const active = user ?? stored;

    if (!active) {
      clearStoredUser();
      return;
    }

    if (active.role === 'admin' || active.role === 'master') {
      navigate('/', { replace: true });
      return;
    }

    // Operador ou outro perfil não usa este login
    clearStoredUser();
  }, [user, isAdmin, isMaster, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      if (!username.trim() || !senha.trim()) {
        setErro('Por favor, preencha todos os campos');
        setCarregando(false);
        return;
      }

      const resultado = await login(username.trim(), senha);

      // Bloquear operador no painel admin
      if (resultado?.role === 'operador') {
        throw new Error('Operadores devem usar o login da IHM.');
      }

      // O redirecionamento será feito pelo useEffect quando o user for atualizado
    } catch (error: any) {
      setErro(error.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 sm:p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-3xl">
        <h2 className="text-3xl font-bold mb-2 text-center" style={{ color: '#4C79AF' }}>
          Painel Administrativo
        </h2>
        <p className="text-base text-gray-500 text-center mb-6">
          Acesso restrito a administradores
        </p>
        <form onSubmit={handleLogin}>
          {erro && (
            <div className="mb-5 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-base">
              {erro}
            </div>
          )}
          <div className="mb-5">
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              Usuário
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Digite seu usuário"
              autoComplete="username"
              required
              disabled={carregando}
            />
          </div>
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Digite sua senha"
              autoComplete="current-password"
              required
              disabled={carregando}
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 px-4 text-white text-xl font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#4C79AF' }}
            disabled={carregando}
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginAdmin;
