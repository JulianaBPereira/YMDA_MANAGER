import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { InputWithKeyboard } from '../../Components/VirtualKeyboard';
import { useKeyboardAwarePageStyle } from '../../contexts/VirtualKeyboardContext';
import {
  IHM_OPERADOR_KEY,
  isIhmOperadorLogado,
  restoreIhmSession,
  saveIhmRoute,
} from '../../utils/ihmPersistence';

const LoginIHM = () => {
  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [erroVisivel, setErroVisivel] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();
  const pageStyle = useKeyboardAwarePageStyle({
    paddingTop: 'max(1rem, env(safe-area-inset-top))',
    paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const senhaInputRef = useRef<HTMLInputElement>(null);
  const erroTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInputFocus = (inputRef: React.RefObject<HTMLInputElement | null>) => () => {
    window.setTimeout(() => {
      if (!inputRef.current || !containerRef.current) return;
      const inputRect = inputRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const scrollTop = containerRef.current.scrollTop;
      const inputTop = inputRect.top - containerRect.top + scrollTop;
      const targetScroll = inputTop - containerRect.height * 0.25;
      containerRef.current.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: 'smooth',
      });
    }, 280);
  };

  const mostrarErro = (mensagem: string) => {
    if (erroTimerRef.current) clearTimeout(erroTimerRef.current);
    setErro(mensagem);
    setErroVisivel(true);
    erroTimerRef.current = setTimeout(() => {
      setErroVisivel(false);
      setTimeout(() => setErro(''), 400);
    }, 3000);
  };

  // Operador ainda logado — voltar para a última tela IHM usada
  useEffect(() => {
    if (!isIhmOperadorLogado()) return;
    restoreIhmSession(navigate);
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
      localStorage.setItem(IHM_OPERADOR_KEY, JSON.stringify({
        username: userData.username,
        nome: userData.nome,
        id: userData.id,
        role: userData.role
      }));

      saveIhmRoute('/ihm/leitor');
      navigate('/ihm/leitor', { replace: true });
    } catch (error: any) {
      mostrarErro(error.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="bg-gray-100 touch-scroll-container touch-pan-y flex items-center justify-center p-4 vk-keyboard-aware"
      style={pageStyle}
    >
      <div className="bg-white p-10 sm:p-12 rounded-3xl shadow-2xl w-full max-w-5xl my-auto">
        <h2 className="text-5xl font-bold mb-10 text-center" style={{ color: '#4C79AF' }}>
          Login
        </h2>

        {erro && (
          <div
            className="mb-8 p-5 bg-red-100 border-2 border-red-400 text-red-700 rounded-xl text-xl transition-opacity duration-400"
            style={{ opacity: erroVisivel ? 1 : 0 }}
          >
            {erro}
          </div>
        )}

        <form onSubmit={handleLogin}>
          {/* Container com duas colunas lado a lado */}
          <div className="grid grid-cols-2 gap-8 mb-10">
            {/* Coluna 1: Usuário */}
            <div>
              <label className="block text-2xl font-semibold text-gray-700 mb-4">
                Usuário
              </label>
              <InputWithKeyboard
                ref={usernameInputRef}
                type="text"
                value={username}
                onChange={setUsername}
                onFocus={handleInputFocus(usernameInputRef)}
                placeholder="Digite seu usuário"
                className="w-full px-6 py-5 text-2xl border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 min-h-[72px]"
                disabled={carregando}
                autoComplete="username"
                keyboardLayout="default"
                keyboardSize="ihm"
              />
            </div>

            {/* Coluna 2: Senha */}
            <div>
              <label className="block text-2xl font-semibold text-gray-700 mb-4">
                Senha
              </label>
              <InputWithKeyboard
                ref={senhaInputRef}
                type="password"
                value={senha}
                onChange={setSenha}
                onFocus={handleInputFocus(senhaInputRef)}
                placeholder="Digite sua senha"
                className="w-full px-6 py-5 text-2xl border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 min-h-[72px]"
                disabled={carregando}
                autoComplete="current-password"
                keyboardLayout="default"
                keyboardSize="ihm"
              />
            </div>
          </div>

          {/* Botão em baixo, ocupando toda a largura */}
          <button
            type="submit"
            className="w-full py-6 px-6 text-white text-3xl font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed min-h-[80px]"
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
