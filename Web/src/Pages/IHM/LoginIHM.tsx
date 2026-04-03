import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { InputWithKeyboard } from '../../Components/VirtualKeyboard';

const LoginIHM = () => {
  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [erroVisivel, setErroVisivel] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const senhaInputRef = useRef<HTMLInputElement>(null);
  const erroTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mostrarErro = (mensagem: string) => {
    if (erroTimerRef.current) clearTimeout(erroTimerRef.current);
    setErro(mensagem);
    setErroVisivel(true);
    erroTimerRef.current = setTimeout(() => {
      setErroVisivel(false);
      setTimeout(() => setErro(''), 400);
    }, 3000);
  };

  // Ao carregar, verificar se há sessão anterior da IHM
  useEffect(() => {
    try {
      const sessao = localStorage.getItem('ihm_sessao');
      if (sessao) {
        const dados = JSON.parse(sessao);
        if (dados.operador) {
          // Sessão encontrada — restaurar para a tela de operação
          navigate('/ihm/operacao', { state: { operador: dados.operador } });
        }
      }
    } catch {
      localStorage.removeItem('ihm_sessao');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      if (!username.trim() || !senha.trim()) {
        mostrarErro('Por favor, preencha todos os campos');
        setCarregando(false);
        return;
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL
        ? `${import.meta.env.VITE_API_URL}/api`
        : `http://${window.location.hostname}:8001/api`;

      const response = await fetch(`${API_BASE_URL}/usuarios/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim(), senha }),
      });

      if (!response.ok) {
        const erro = await response.json().catch(() => ({}));
        throw new Error(erro.detail || 'Erro ao fazer login');
      }

      const userData = await response.json();

      // Operador deve ter role 'operador'
      if (userData.role !== 'operador') {
        throw new Error('Acesso negado. Usuário sem permissão de acesso.');
      }

      // Salvar informação do operador que fez login (não é o funcionário, é o usuário do sistema)
      localStorage.setItem('ihm_operador_logado', JSON.stringify({
        username: userData.username,
        nome: userData.nome,
        id: userData.id,
        role: userData.role
      }));

      // Redirecionar para o Leitor RFID
      navigate('/ihm/leitor', { replace: true });
    } catch (error: any) {
      mostrarErro(error.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-start justify-center p-4 pt-16">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-2xl">
        <h2 className="text-4xl font-bold mb-8 text-center" style={{ color: '#4C79AF' }}>
          Login
        </h2>

        {erro && (
          <div
            className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-lg transition-opacity duration-400"
            style={{ opacity: erroVisivel ? 1 : 0 }}
          >
            {erro}
          </div>
        )}

        <form onSubmit={handleLogin}>
          {/* Container com duas colunas lado a lado */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Coluna 1: Usuário */}
            <div>
              <label className="block text-xl font-semibold text-gray-700 mb-3">
                Usuário
              </label>
              <InputWithKeyboard
                ref={usernameInputRef}
                type="text"
                value={username}
                onChange={setUsername}
                placeholder="Digite seu usuário"
                className="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                disabled={carregando}
                autoComplete="username"
                keyboardLayout="default"
              />
            </div>

            {/* Coluna 2: Senha */}
            <div>
              <label className="block text-xl font-semibold text-gray-700 mb-3">
                Senha
              </label>
              <InputWithKeyboard
                ref={senhaInputRef}
                type="password"
                value={senha}
                onChange={setSenha}
                placeholder="Digite sua senha"
                className="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                disabled={carregando}
                autoComplete="current-password"
                keyboardLayout="default"
              />
            </div>
          </div>

          {/* Botão em baixo, ocupando toda a largura */}
          <button
            type="submit"
            className="w-full py-4 px-4 text-white text-2xl font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mb-6"
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

export default LoginIHM;
