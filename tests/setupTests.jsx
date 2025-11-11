import { defaultConfig } from 'antd/lib/theme/internal';

defaultConfig.hashed = false;

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

global.localStorage = localStorageMock;

Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(),
});

class Worker {
  constructor(stringUrl) {
    this.url = stringUrl;
    this.onmessage = () => {};
  }

  postMessage(msg) {
    this.onmessage(msg);
  }
}
window.Worker = Worker;

// Mock de ResizeObserver para componentes que dependen de observación de tamaño
// (Ant Design, Recharts y libs relacionadas)
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-undef
  window.ResizeObserver = ResizeObserver;
}

if (typeof window !== 'undefined') {
  // ref: https://github.com/ant-design/ant-design/issues/18774
  if (!window.matchMedia) {
    Object.defineProperty(global.window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: jest.fn(() => ({
        matches: false,
        addListener: jest.fn(),
        removeListener: jest.fn(),
      })),
    });
  }
  if (!window.matchMedia) {
    Object.defineProperty(global.window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: jest.fn((query) => ({
        matches: query.includes('max-width'),
        addListener: jest.fn(),
        removeListener: jest.fn(),
      })),
    });
  }
}
const errorLog = console.error;
Object.defineProperty(global.window.console, 'error', {
  writable: true,
  configurable: true,
  value: (...rest) => {
    const logStr = rest.join('');
    if (
      logStr.includes(
        'Warning: An update to %s inside a test was not wrapped in act(...)',
      )
    ) {
      return;
    }
    errorLog(...rest);
  },
});

// Asegurar React disponible a nivel global en ambiente de pruebas
// para bibliotecas que aún esperan React en el scope
// (compatibilidad con transformaciones JSX en Jest)
// eslint-disable-next-line @typescript-eslint/no-var-requires
// Exponer React globalmente para evitar errores "React is not defined"
// eslint-disable-next-line @typescript-eslint/no-var-requires
global.React = require('react');
