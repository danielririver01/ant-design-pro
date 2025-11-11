import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Mock de servicios para evitar llamadas reales de red
jest.mock('../src/services/analysis_service', () => ({
  getMonthlySales: jest.fn(async () => ({
    labels: ['Ene', 'Feb', 'Mar'],
    valores: [1000, 2000, 1500],
  })),
  getAnnualSales: jest.fn(async () => ({
    labels: ['2024', '2025'],
    valores: [120000, 180000],
  })),
  getSalesByCategory: jest.fn(async () => ({
    labels: ['Ropa', 'Zapatos', 'Accesorios'],
    valores: [40000, 60000, 20000],
  })),
  getKPIs: jest.fn(async () => ({
    usuarios: { total: 2 },
    productos: { total: 10 },
    clientes: { total: 5 },
    pedidos: { total: 8 },
  })),
  getPopularSearches: jest.fn(async () => ({
    data: [
      { query: 'zapatos', count: 100 },
      { query: 'camisetas', count: 80 },
      { query: 'jeans', count: 60 },
      { query: 'gorras', count: 40 },
      { query: 'chaquetas', count: 20 },
    ],
  })),
}));

// Import del componente bajo prueba
const { default: AnalysisPage } = require('../src/pages/Dashboard/Analysis');

describe('Dashboard Analysis', () => {
  it('renderiza ranking y evita estados vacíos con datos simulados', async () => {
    // Render del componente
    render(<AnalysisPage />);

    // Esperar a que la sección de ranking esté poblada
    const rankingTitle = await screen.findByText(/Ranking de búsqueda/i);
    expect(rankingTitle).toBeInTheDocument();

    // Debe mostrar elementos en la lista (5 simulados)
    const items = await screen.findAllByRole('listitem');
    expect(items.length).toBeGreaterThanOrEqual(5);

    // Validar que no se muestren estados vacíos cuando hay datos
    await waitFor(() => {
      expect(
        screen.queryByText(/No hay datos de ventas mensuales disponibles/i),
      ).toBeNull();
      expect(
        screen.queryByText(/No hay datos de ventas anuales disponibles/i),
      ).toBeNull();
      expect(
        screen.queryByText(/No hay datos de categorías disponibles/i),
      ).toBeNull();
    });
  });
});

