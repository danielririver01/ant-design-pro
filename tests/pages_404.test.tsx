import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
// Caso 1: Navegación usando useNavigate
describe('404 Page navigation', () => {
  it('navega al inicio con useNavigate', () => {
    const mockedNavigate = jest.fn();
    jest.doMock('@umijs/max', () => ({
      useNavigate: () => mockedNavigate,
    }));

    const { default: NoFoundPage } = require('../src/pages/404');

    render(<NoFoundPage />);
    const button = screen.getByRole('button', { name: /Volver al inicio/i });
    fireEvent.click(button);
    expect(mockedNavigate).toHaveBeenCalledWith('/');
  });

  it('usa fallback window.location cuando no hay navigate', () => {
    // Mock sin navigate disponible
    jest.doMock('@umijs/max', () => ({
      useNavigate: () => undefined,
    }));

    // Preparar objeto location
    const originalLocation = window.location;
    delete (window as any).location;
    (window as any).location = { href: '' };

    const { default: NoFoundPage } = require('../src/pages/404');

    render(<NoFoundPage />);
    const button = screen.getByRole('button', { name: /Volver al inicio/i });
    fireEvent.click(button);
    expect((window as any).location.href).toBe('/');

    // Restaurar location original
    window.location = originalLocation;
  });
});
