import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  isIhmOperadorLogado,
  isIhmRoute,
  saveIhmRoute,
} from '../utils/ihmPersistence';

/** Persiste a rota IHM atual e protege telas que exigem login do operador. */
export default function IhmNavigationPersistence() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    saveIhmRoute(location.pathname);
  }, [location.pathname]);

  // Ao minimizar/fechar o app (kiosk, tablet), garantir rota salva
  useEffect(() => {
    const persistRoute = () => saveIhmRoute(location.pathname);
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') persistRoute();
    };
    window.addEventListener('pagehide', persistRoute);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', persistRoute);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [location.pathname]);

  useEffect(() => {
    const path = location.pathname;
    if (path === '/ihm/login') return;
    if (!isIhmRoute(path)) return;
    if (!isIhmOperadorLogado()) {
      navigate('/ihm/login', { replace: true });
    }
  }, [location.pathname, navigate]);

  return null;
}
