import { LinkOutlined } from '@ant-design/icons';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { SettingDrawer } from '@ant-design/pro-components';
import type { RequestConfig, RunTimeLayoutConfig } from '@umijs/max';
import { history, Link } from '@umijs/max';
import React, { useEffect } from 'react';
import { ConfigProvider, App as AntApp } from 'antd';
import { registerAntdAppApis } from '@/shared/antd_app_bridge';
import esES from 'antd/locale/es_ES';
import {
  AvatarDropdown,
  AvatarName,
  Footer,
  Question,
  SelectLang,
} from '@/components';
import { currentUser as queryCurrentUser } from '@/services/ant-design-pro/api';
import defaultSettings from '../config/defaultSettings';
import { errorConfig } from './requestErrorConfig';
import { getAccessToken, setAccessToken, rehydrateAccessTokenFromStorage } from '@/shared/auth/tokenMemory';
import { refreshAccessToken } from '@/shared/auth/refresh';
import '@ant-design/v5-patch-for-react-19';

const isDev = process.env.NODE_ENV === 'development';
const isDevOrTest = isDev || process.env.CI;
const loginPath = '/user/login';

/**
 * Rutas públicas que no requieren autenticación
 */
const publicPaths = [loginPath, '/user/register', '/user/register-result'];

/**
 * @see https://umijs.org/docs/api/runtime-config#getinitialstate
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
}> {
  // ✅ fetchUserInfo: no rehidrata ni refresca; solo consulta usuario
  const fetchUserInfo = async () => {
    try {
      const msg = await queryCurrentUser();
      return msg.data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.debug('[Auth] fetchUserInfo falló / usuario no autenticado', error);
      }
      return undefined;
    }
  };

  const { pathname } = window.location;
  const result: {
    settings?: Partial<LayoutSettings>;
    currentUser?: API.CurrentUser;
    loading?: boolean;
    fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
  } = { loading: true };

  // ✅ Ejecutar rehidratación una sola vez al arranque
  rehydrateAccessTokenFromStorage();

  if (!publicPaths.includes(pathname)) {
    try {
      // Intentar refresh antes de consultar usuario
      await refreshAccessToken();
      // Espera corta para evitar carrera entre refresh y /auth/me
      await new Promise((res) => setTimeout(res, 200));
      const currentUser = await fetchUserInfo();
      result.currentUser = currentUser;
    } catch (_e) {
      result.currentUser = undefined;
    }
  }

  result.loading = false;
  result.fetchUserInfo = fetchUserInfo;
  result.settings = defaultSettings as Partial<LayoutSettings>;
  return result;
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({
  initialState,
  setInitialState,
}) => {
  return {
    actionsRender: () => [
      <Question key="doc" />,
      <SelectLang key="SelectLang" />,
    ],
    avatarProps: {
      src: initialState?.currentUser?.avatar,
      title: <AvatarName />,
      render: (_, avatarChildren) => (
        <AvatarDropdown>{avatarChildren}</AvatarDropdown>
      ),
    },
    waterMarkProps: {
      content: initialState?.currentUser?.name,
    },
    footerRender: () => <Footer />,
  onPageChange: async () => {
      // ✅ Verificar que history.location existe
      if (!history?.location) return;
      
      const { location } = history;
      const searchParams = new URLSearchParams(location.search || '');
      // ✅ Romper el bucle si ya estamos en login con redirect
      if (location.pathname === loginPath && searchParams.get('redirect')) {
        return;
      }
      
      // ✅ No actuar mientras se está verificando autenticación
      if (initialState?.loading) {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.debug('[AuthGuard] loading activo, se pospone decisión de redirección');
        }
        return;
      }
      
      // ✅ Si no hay usuario Y no estamos en ruta pública, redirigir
      if (!initialState?.currentUser && !publicPaths.includes(location.pathname)) {
        try {
          const refreshed = await refreshAccessToken();
          if (refreshed) {
            const fetchedUser = await initialState?.fetchUserInfo?.();
            if (fetchedUser) {
              setInitialState((prev) => ({ ...prev, currentUser: fetchedUser }));
              return; // Ya autenticado, no redirigir
            }
          }
        } catch (e) {
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.debug('[AuthGuard] refreshAccessToken falló:', e);
          }
        }
        // Si no se pudo autenticar, redirigir a login
        try {
          if (history && typeof history.push === 'function') {
            history.push(loginPath);
          } else if (typeof window !== 'undefined') {
            window.location.href = loginPath;
          }
        } catch (_err) {
          if (typeof window !== 'undefined') {
            window.location.assign(loginPath);
          }
        }
      }
    },
    bgLayoutImgList: [
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/D2LWSqNny4sAAAAAAAAAAAAAFl94AQBr',
        left: 85,
        bottom: 100,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/C2TWRpJpiC0AAAAAAAAAAAAAFl94AQBr',
        bottom: -68,
        right: -45,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/F6vSTbj8KpYAAAAAAAAAAAAAFl94AQBr',
        bottom: 0,
        left: 0,
        width: '331px',
      },
    ],
    links: isDevOrTest
      ? [
          <Link key="openapi" to="/umi/plugin/openapi" target="_blank">
            <LinkOutlined />
            <span>OpenAPI 文档</span>
          </Link>,
        ]
      : [],
    menuHeaderRender: undefined,
    // 自定义 403 页面
    // unAccessible: <div>unAccessible</div>,
    // 增加一个 loading 的状态
    childrenRender: (children) => {
      // if (initialState?.loading) return <PageLoading />;
      const AntdAppRegistrar: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        const { message, notification } = AntApp.useApp();
        useEffect(() => {
          registerAntdAppApis({ message, notification });
        }, [message, notification]);
        return <>{children}</>;
      };

      return (
        <ConfigProvider
          locale={esES}
          theme={{
            cssVar: true,
            token: {
              fontFamily: 'AlibabaSans, sans-serif',
            },
          }}
        >
          <AntApp>
            <AntdAppRegistrar>
              {children}
              {isDevOrTest && (
                <SettingDrawer
                  disableUrlParams
                  enableDarkTheme
                  settings={initialState?.settings}
                  onSettingChange={(settings) => {
                    setInitialState((preInitialState) => ({
                      ...preInitialState,
                      settings,
                    }));
                  }}
                />
              )}
            </AntdAppRegistrar>
          </AntApp>
        </ConfigProvider>
      );
    },
    ...initialState?.settings,
  };
};

/**
 * @name request 配置，可以配置错误处理
 * 它基于 axios 和 ahooks 的 useRequest 提供了一套统一的网络请求和错误处理方案。
 * @doc https://umijs.org/docs/max/request#配置
 */
export const request: RequestConfig = {
  // En desarrollo usamos rutas relativas para que el proxy de Umi dev-server
  // maneje la redirección a http://localhost:5000 evitando CORS en navegador.
  baseURL: isDev ? '/api' : 'https://staging.tiendavirtual.example/api',
  // Asegurar envío de cookies (refresh/csrf) en peticiones
  credentials: 'include',
  ...errorConfig,
};
