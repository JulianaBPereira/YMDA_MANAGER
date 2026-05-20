import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  isIhmOperadorLogado,
  restoreIhmSession,
} from '../utils/ihmPersistence';

/** Redireciona /ihm para login ou última tela, conforme sessão do operador. */
export default function IhmEntryRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isIhmOperadorLogado()) {
      navigate('/ihm/login', { replace: true });
      return;
    }

    restoreIhmSession(navigate);
  }, [navigate]);

  return null;
}
