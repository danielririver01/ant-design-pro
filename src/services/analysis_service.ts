import { request } from '@umijs/max';

/**
 * Servicio de datos para el Dashboard de Análisis.
 * Endpoints basados en la API Flask:
 * - /ESTADISTICAS/estadisticas
 * - /ESTADISTICAS/estadisticas/anuales
 * - /ESTADISTICAS/ventas_por_categoria
 * - /KPIS/kpis
 * - /faq/popular
 */

export type SeriesResponse = { labels: (string | number)[]; valores: number[] };
export type KPIsResponse = {
  usuarios: { total: number };
  productos: { total: number };
  clientes: { total: number };
  pedidos: { total: number };
};

export type PopularSearchItem = { query: string; count: number };
export type PopularSearchResponse = { success: boolean; data: PopularSearchItem[] };

export async function getMonthlySales(params?: { desde?: string; hasta?: string }): Promise<SeriesResponse> {
  return request('/ESTADISTICAS/estadisticas', {
    method: 'GET',
    params,
  });
}

export async function getAnnualSales(params?: { desde?: string; hasta?: string }): Promise<SeriesResponse> {
  return request('/ESTADISTICAS/estadisticas/anuales', {
    method: 'GET',
    params,
  });
}

export async function getSalesByCategory(params?: { desde?: string; hasta?: string }): Promise<SeriesResponse> {
  return request('/ESTADISTICAS/ventas_por_categoria', {
    method: 'GET',
    params,
  });
}

export async function getKPIs(): Promise<KPIsResponse> {
  return request('/KPIS/kpis', {
    method: 'GET',
  });
}

export async function getPopularSearches(): Promise<PopularSearchResponse> {
  return request('/faq/popular', {
    method: 'GET',
  });
}