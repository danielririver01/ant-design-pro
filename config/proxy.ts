/**
 * @name 代理的配置
 * @see 在生产环境 代理是无法生效的，所以这里没有生产环境的配置
 * -------------------------------
 * The agent cannot take effect in the production environment
 * so there is no configuration of the production environment
 * For details, please see
 * https://pro.ant.design/docs/deploy
 *
 * @doc https://umijs.org/docs/guides/proxy
 */
export default {
  // Desarrollo local: redirigir todas las llamadas /api/* al backend Flask
  // que corre en http://localhost:5000 para evitar problemas de CORS.
  dev: {
    '/api/': {
      target: 'http://localhost:5000',
      changeOrigin: true,
      ws: true,
      secure: false,
      // Mantener el prefijo /api porque el backend registra blueprints bajo /api
      // Si en tu backend las rutas no usan /api, cambia a: pathRewrite: { '^/api': '' }
      pathRewrite: { '^/api': '/api' },
      // Agregar cabeceras CORS en las respuestas proxied (no suelen ser necesarias
      // porque el proxy evita CORS, pero ayuda en integraciones específicas).
      onProxyRes(proxyRes) {
        proxyRes.headers['Access-Control-Allow-Origin'] = 'http://localhost:8000';
        proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
      },
      // Manejo de errores cuando el backend no está disponible
      onError(err, req, res) {
        res.writeHead(502, { 'Content-Type': 'text/plain' });
        res.end('Proxy error: backend Flask no disponible en http://localhost:5000');
      },
    },
  },
  /**
   * @name 详细的代理配置
   * @doc https://github.com/chimurai/http-proxy-middleware
   */
  test: {
    // localhost:8000/api/** -> https://preview.pro.ant.design/api/**
    '/api/': {
      target: 'https://proapi.azurewebsites.net',
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
  },
  pre: {
    '/api/': {
      target: 'your pre url',
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
  },
};
