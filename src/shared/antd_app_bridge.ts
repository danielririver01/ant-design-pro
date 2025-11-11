// Puente para integrar correctamente los APIs de antd (message, notification)
// con el sistema de temas dinámicos usando el componente <App />.
// Permite eliminar el warning: "Static function can not consume context like dynamic theme."
// y mantener compatibilidad con componentes legacy mediante una cola temporal.

import type { MessageInstance } from 'antd/es/message/interface';
import type { NotificationInstance } from 'antd/es/notification/interface';

let messageApiRef: MessageInstance | null = null;
let notificationApiRef: NotificationInstance | null = null;

// Colas para llamadas realizadas antes de que el App Provider registre los APIs.
const pendingMessageCalls: Array<(api: MessageInstance) => void> = [];
const pendingNotificationCalls: Array<(api: NotificationInstance) => void> = [];

export function registerAntdAppApis(options: {
  message: MessageInstance;
  notification: NotificationInstance;
}): void {
  messageApiRef = options.message;
  notificationApiRef = options.notification;

  // Vaciar colas pendientes
  if (pendingMessageCalls.length) {
    pendingMessageCalls.splice(0).forEach((fn) => {
      try {
        fn(messageApiRef!);
      } catch (e) {
        // Silenciar errores de ejecución al vaciar cola
      }
    });
  }

  if (pendingNotificationCalls.length) {
    pendingNotificationCalls.splice(0).forEach((fn) => {
      try {
        fn(notificationApiRef!);
      } catch (e) {
        // Silenciar errores de ejecución al vaciar cola
      }
    });
  }
}

export function getAntdMessageApi(): MessageInstance | null {
  return messageApiRef;
}

export function getAntdNotificationApi(): NotificationInstance | null {
  return notificationApiRef;
}

// Proxy con fallback a colas para migración gradual en código legacy.
// Estos métodos NO usan las funciones estáticas de antd, evitando el warning.
export const MessageProxy = {
  success(content: any, duration?: number, onClose?: () => void) {
    if (messageApiRef) return messageApiRef.success(content, duration, onClose);
    pendingMessageCalls.push((api) => api.success(content, duration, onClose));
  },
  error(content: any, duration?: number, onClose?: () => void) {
    if (messageApiRef) return messageApiRef.error(content, duration, onClose);
    pendingMessageCalls.push((api) => api.error(content, duration, onClose));
  },
  warning(content: any, duration?: number, onClose?: () => void) {
    if (messageApiRef) return messageApiRef.warning(content, duration, onClose);
    pendingMessageCalls.push((api) => api.warning(content, duration, onClose));
  },
  info(content: any, duration?: number, onClose?: () => void) {
    if (messageApiRef) return messageApiRef.info(content, duration, onClose);
    pendingMessageCalls.push((api) => api.info(content, duration, onClose));
  },
  loading(content: any, duration?: number, onClose?: () => void) {
    if (messageApiRef) return messageApiRef.loading(content, duration, onClose);
    pendingMessageCalls.push((api) => api.loading(content, duration, onClose));
  },
  open(args: any) {
    if (messageApiRef) return messageApiRef.open(args);
    pendingMessageCalls.push((api) => api.open(args));
  },
  destroy(key?: any) {
    if (messageApiRef) return messageApiRef.destroy(key);
    // Si aún no está disponible, no hacemos nada.
  },
};

export const NotificationProxy = {
  open(args: any) {
    if (notificationApiRef) return notificationApiRef.open(args);
    pendingNotificationCalls.push((api) => api.open(args));
  },
  success(args: any) {
    if (notificationApiRef) return notificationApiRef.success(args);
    pendingNotificationCalls.push((api) => api.success(args));
  },
  error(args: any) {
    if (notificationApiRef) return notificationApiRef.error(args);
    pendingNotificationCalls.push((api) => api.error(args));
  },
  info(args: any) {
    if (notificationApiRef) return notificationApiRef.info(args);
    pendingNotificationCalls.push((api) => api.info(args));
  },
  warning(args: any) {
    if (notificationApiRef) return notificationApiRef.warning(args);
    pendingNotificationCalls.push((api) => api.warning(args));
  },
  destroy(key?: any) {
    if (notificationApiRef) return notificationApiRef.destroy(key);
  },
};