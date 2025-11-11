// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 发送验证码 POST /api/login/captcha */
export async function getFakeCaptcha(
  params: {
    // query
    /** 手机号 */
    phone?: string;
  },
  options?: { [key: string]: any },
) {
  // Usar fetch para evitar depender del sistema de plugins de Umi durante la petición
  const url = new URL('/api/login/captcha', window.location.origin);
  if (params?.phone) url.searchParams.set('phone', String(params.phone));
  const resp = await fetch(url.toString(), {
    method: 'GET',
    ...(options || {}),
  } as RequestInit);
  try {
    const data = await resp.json();
    return data as any;
  } catch (_) {
    return { status: resp.status } as any;
  }
}
