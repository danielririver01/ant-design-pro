import { createConfig } from '@umijs/max/test';

export default async (): Promise<any> => {
  // Usar solo createConfig para evitar parsear la config de Umi (config/config.ts)
  // que puede fallar en algunos entornos de Jest.
  const config = await createConfig({
    target: 'browser',
  });
  return {
    ...config,
    moduleNameMapper: {
      ...((config as any).moduleNameMapper || {}),
      '^@/(.*)$': '<rootDir>/src/$1',
    },
    testEnvironmentOptions: {
      ...(config?.testEnvironmentOptions || {}),
      url: 'http://localhost:8000',
    },
    setupFiles: [...(config.setupFiles || []), './tests/setupTests.jsx'],
    setupFilesAfterEnv: [...(config.setupFilesAfterEnv || []), '@testing-library/jest-dom'],
    globals: {
      ...config.globals,
      localStorage: null,
    },
  };
};
