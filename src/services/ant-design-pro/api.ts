// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** Obtener usuario actual GET /auth/me */
export async function currentUser(options?: { [key: string]: any }) {
  return request<{
    data: API.CurrentUser;
  }>('/api/auth/me', {
    method: 'GET',
    ...(options || {}),
  });
}

/** Logout POST /auth/logout */
export async function outLogin(options?: { [key: string]: any }) {
  return request<Record<string, any>>('/auth/logout', {
    method: 'POST',
    ...(options || {}),
  });
}

/** Login POST /api/auth/login */
export async function login(body: API.LoginParams, options?: { [key: string]: any }) {
  // Usar fetch directamente para evitar el error de runtime de Umi (applyPlugins=null)
  // y asegurar que el login funcione incluso si el sistema de plugins no está inicializado.
  const resp = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    credentials: 'include',
    // Permitir opciones adicionales si se proporcionan
    ...(options || {}),
  } as RequestInit);

  let data: any = {};
  try {
    data = await resp.json();
  } catch (_) {
    // si no hay JSON, mantenemos data vacío
  }

  if (!resp.ok) {
    // Normalizar respuesta de error con campos compatibles
    return {
      status: 'error',
      type: body?.type,
      ...(typeof data === 'object' ? data : {}),
    } as any;
  }

  return data as any;
}

/** 此处后端没有提供注释 GET /notices */
export async function getNotices(options?: { [key: string]: any }) {
  return request<API.NoticeIconList>('/notices', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 获取规则列表 GET /rule */
export async function rule(
  params: {
    // query
    /** 当前的页码 */
    current?: number;
    /** 页面的容量 */
    pageSize?: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.RuleList>('/rule', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 更新规则 PUT /rule */
export async function updateRule(options?: { [key: string]: any }) {
  return request<API.RuleListItem>('/rule', {
    method: 'POST',
    data: {
      method: 'update',
      ...(options || {}),
    },
  });
}

/** 新建规则 POST /rule */
export async function addRule(options?: { [key: string]: any }) {
  return request<API.RuleListItem>('/rule', {
    method: 'POST',
    data: {
      method: 'post',
      ...(options || {}),
    },
  });
}

/** 删除规则 DELETE /rule */
export async function removeRule(options?: { [key: string]: any }) {
  return request<Record<string, any>>('/rule', {
    method: 'POST',
    data: {
      method: 'delete',
      ...(options || {}),
    },
  });
}
