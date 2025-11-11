import type { RequestOptions } from '@@/plugin-request/request';
import type { RequestConfig } from '@umijs/max';
import { MessageProxy, NotificationProxy } from '@/shared/antd_app_bridge';
import { getAccessToken } from '@/shared/auth/tokenMemory';
import { refreshAccessToken } from '@/shared/auth/refresh';

enum ErrorShowType {
  SILENT = 0,
  WARN_MESSAGE = 1,
  ERROR_MESSAGE = 2,
  NOTIFICATION = 3,
  REDIRECT = 9,
}

interface ResponseStructure {
  success: boolean;
  data: any;
  errorCode?: string | number;
  errorMessage?: string;
  showType?: ErrorShowType;
}

/**
 * @name 错误处理
 * pro 自带的错误处理， 可以在自己的改动
 * @doc https://umijs.org/docs/max/request#配置
 */
export const errorConfig: RequestConfig = {
  // ✅ IMPORTANTE: Incluir credenciales (cookies) en peticiones
  credentials: 'include',

  errorConfig: {
    // 错误抛出
    errorThrower: (res) => {
      const { success, data, errorCode, errorMessage, showType } =
        res as unknown as ResponseStructure;

      // Ajuste de compatibilidad:
      // Muchos endpoints del backend devuelven solo { data } con HTTP 200
      // sin el campo `success`. No debemos tratar eso como error.
      const successIsBoolean = typeof success === 'boolean';
      const isExplicitBizError = successIsBoolean && success === false;
      const isAuthError = errorCode === '401' || errorCode === 401;

      if (isExplicitBizError || isAuthError) {
        const error: any = new Error(errorMessage || '请求失败');
        error.name = 'BizError';
        error.info = { errorCode, errorMessage, showType, data };
        throw error;
      }
      // En el resto de casos, no lanzar: dejar que el manejador HTTP trate códigos != 2xx
    },

    // 错误接收及处理
    errorHandler: (error: any, opts: any) => {
      if (opts?.skipErrorHandler) throw error;

      // 我们的 errorThrower 抛出的错误
      if (error.name === 'BizError') {
        const errorInfo: ResponseStructure | undefined = error.info;
        if (errorInfo) {
          const { errorMessage, errorCode } = errorInfo;

          // ✅ MANEJO ESPECIAL: Error 401 (no autenticado)
          if (errorCode === '401' || errorCode === 401) {
            // Intentar refrescar en caliente; si no se puede, limpiar y redirigir
            refreshAccessToken().then((ok) => {
              if (!ok) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('token');
                const urlStr = error.request?.url || '';
                // Evitar redirección inmediata para peticiones de carga de usuario
                const isCurrentUserRequest = urlStr.includes('/currentUser') || urlStr.includes('/auth/me');
                if (!isCurrentUserRequest) {
                  MessageProxy.warning(errorMessage || '请先登录！');
                  setTimeout(() => {
                    window.location.href = '/user/login';
                  }, 1000);
                }
              }
            });
            return;
          }

          // Manejo normal de errores según showType
          switch (errorInfo.showType) {
            case ErrorShowType.SILENT:
              // do nothing
              break;
            case ErrorShowType.WARN_MESSAGE:
              MessageProxy.warning(errorMessage);
              break;
            case ErrorShowType.ERROR_MESSAGE:
              MessageProxy.error(errorMessage);
              break;
            case ErrorShowType.NOTIFICATION:
              NotificationProxy.open({
                description: errorMessage,
                message: String(errorCode),
              });
              break;
            case ErrorShowType.REDIRECT:
              // TODO: redirect
              break;
            default:
              MessageProxy.error(errorMessage || 'Error en la solicitud');
          }
        }
      } else if (error.response) {
        // Error HTTP estándar
        const { status } = error.response;
        
        if (status === 401) {
          // Intentar refresh silencioso antes de redirigir
          refreshAccessToken().then((ok) => {
            if (!ok) {
              localStorage.removeItem('access_token');
              localStorage.removeItem('token');
              MessageProxy.error('Sesión expirada. Por favor, inicia sesión.');
              setTimeout(() => {
                window.location.href = '/user/login';
              }, 1000);
            }
          });
        } else {
          MessageProxy.error(`Response status: ${status}`);
        }
      } else if (error.request) {
        MessageProxy.error('None response! Please retry.');
      } else {
        MessageProxy.error('Request error, please retry.');
      }
    },
  },

  /// Interceptor de solicitudes
  requestInterceptors: [
    (config: RequestOptions) => {
      // Inyectar token JWT desde memoria; fallback a localStorage
      const token = getAccessToken() || localStorage.getItem('access_token') || localStorage.getItem('token');
      
      const headers = {
        ...(config.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      
      return { ...config, headers };
    },
  ],

  responseInterceptors: [
    (response) => {
      // Ya no necesitamos verificar data.success aquí
      // El errorThrower lo maneja
      return response;
    },
  ],
};
