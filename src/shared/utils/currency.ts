/**
 * Utilidades de moneda para formato COP y conversiones básicas.
 * Comentarios en español, código en inglés.
 */

/** Formatear valores en Pesos Colombianos (COP) con separadores adecuados */
export function formatCOP(value: number): string {
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value || 0);
  } catch {
    // Fallback simple
    const parts = Math.floor(value || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `$ ${parts}`;
  }
}

/** Conversión básica de divisa usando una tasa proporcionada (si aplica) */
export function convertToCOP(amount: number, fromCurrency: string, rateToCOP?: number): number {
  // Si ya está en COP o no hay tasa, regresar el valor tal cual
  if (!rateToCOP || fromCurrency.toUpperCase() === 'COP') {
    return amount;
  }
  return amount * rateToCOP;
}