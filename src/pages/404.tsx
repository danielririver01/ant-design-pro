import { useNavigate } from '@umijs/max';
import { Button, Card, Result } from 'antd';
import React from 'react';

const NoFoundPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    try {
      // Intento de navegación con router
      if (navigate) {
        navigate('/');
        return;
      }
      // Fallback seguro en caso de que la navegación no esté disponible en runtime
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (_err) {
      // Último recurso de redirección sin romper HMR
      if (typeof window !== 'undefined') {
        window.location.assign('/');
      }
    }
  };

  return (
    <Card variant="borderless">
      <Result
        status="404"
        title="404"
        subTitle="Lo sentimos, la página que visitaste no existe."
        extra={
          <Button type="primary" onClick={handleGoHome}>
            Volver al inicio
          </Button>
        }
      />
    </Card>
  );
};

export default NoFoundPage;