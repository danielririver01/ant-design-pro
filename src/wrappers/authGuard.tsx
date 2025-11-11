import { useModel, useNavigate } from '@umijs/max';
import { Button, Result, Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import { MessageProxy } from '@/shared/antd_app_bridge';
import { refreshAccessToken } from '@/shared/auth/refresh';
import { getAccessToken } from '@/shared/auth/tokenMemory';

/**
 * Wrapper para proteger rutas que requieren:
 * - Sesión activa (token o currentUser)
 * - Suscripción activa (si el backend lo exige)
 */
const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { initialState, setInitialState } = useModel('@@initialState');
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [subscriptionInactive, setSubscriptionInactive] = useState(false);

  // Flag y URL configurables para verificación de suscripción
  // Se controlan vía variables definidas en config/config.ts (process.env)
  const ENABLE_SUBSCRIPTION_CHECK =
    process?.env?.SUBSCRIPTION_STATUS_CHECK === 'true';
  const SUBSCRIPTION_STATUS_URL =
    process?.env?.SUBSCRIPTION_STATUS_URL || '/api/subscription/status';

  useEffect(() => {
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
    const FIRST_FETCH_DELAY_MS = Number(
      process?.env?.FIRST_FETCH_DELAY_MS ?? 300,
    );

    const verify = async () => {
      // Bloquear el render mientras el runtime carga
      if (initialState?.loading) {
        setChecking(true);
        return;
      }

      setChecking(true);

      // Intentar refrescar SIEMPRE: el backend decide si hay cookie/refresh disponible
      let refreshed = false;
      try {
        refreshed = await refreshAccessToken();
      } catch (_err) {
        // Silenciar errores: si no hay refresh cookie, continuamos
      }

      if (refreshed) {
        // Pequeño delay para asegurar propagación del header Authorization vía interceptores globales
        await delay(FIRST_FETCH_DELAY_MS);
      }

      // Intentar obtener el usuario actual; si falla, hasUser seguirá siendo falso
      try {
        const user = await initialState?.fetchUserInfo?.();
        if (user) {
          // Usar setInitialState para propagar y re-renderizar de forma segura
          setInitialState((s: any) => ({ ...s, currentUser: user }));
        }
        // Usar el snapshot local del usuario para evitar depender del re-render
        const hasUserNow = !!user || !!initialState?.currentUser;
        setAuthed(hasUserNow);
      } catch (_err) {
        // Silenciar: el guard mostrará 403 si no se obtuvo usuario
        setAuthed(false);
      }

      // Verificación opcional de suscripción activa SOLO si hay usuario
      const hasUserNow = authed || !!initialState?.currentUser;
      if (ENABLE_SUBSCRIPTION_CHECK && hasUserNow) {
        try {
          const tokenMem = getAccessToken();
          const token =
            tokenMem ??
            (typeof localStorage !== 'undefined'
              ? localStorage.getItem('access_token') ||
                localStorage.getItem('token')
              : null);
          const headers: Record<string, string> = token
            ? { Authorization: `Bearer ${token}` }
            : {};
          const resp = await fetch(SUBSCRIPTION_STATUS_URL, {
            headers,
            credentials: 'include',
          });
          if (resp?.ok) {
            const json = await resp.json();
            if (json?.data?.active === false) {
              setSubscriptionInactive(true);
            }
          }
        } catch (_err) {
          // Silenciar errores del guard opcional
        }
      }

      setChecking(false);
      // No redirigir automáticamente para evitar bucles; mostrar 403 con botón
    };

    verify();
  }, [initialState?.loading, setInitialState]);

  // Requerir usuario cargado para considerar autenticado
  const hasUserFinal = authed || !!initialState?.currentUser;

  if (checking) {
    // Usar patrón 'fullscreen' para que el prop 'tip' sea válido en antd v5
    // y evitar el warning: "[antd: Spin] `tip` only work in nest or fullscreen pattern."
    return <Spin tip="Verificando acceso..." fullscreen />;
  }

  if (!hasUserFinal) {
    return (
      <Result
        status="403"
        title="Autenticación requerida"
        subTitle="Necesitas iniciar sesión para acceder a esta sección."
        extra={
          <Button
            type="primary"
            onClick={() => {
              try {
                navigate('/user/login');
              } catch (_e) {
                if (typeof window !== 'undefined') {
                  window.location.href = '/user/login';
                }
              }
            }}
          >
            Ir al login
          </Button>
        }
      />
    );
  }

  if (subscriptionInactive) {
    return (
      <Result
        status="403"
        title="Suscripción no activa"
        subTitle="Tu suscripción no está activa. Actualiza tu plan para continuar."
        extra={
          <Button
            type="primary"
            onClick={() => {
              try {
                navigate('/user/profile');
              } catch (_e) {
                if (typeof window !== 'undefined') {
                  window.location.href = '/user/profile';
                }
              }
            }}
          >
            Ver mi suscripción
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
};

export default AuthGuard;
