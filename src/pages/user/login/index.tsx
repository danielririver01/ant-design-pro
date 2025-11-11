import { LockOutlined, UserOutlined } from '@ant-design/icons';
import {
  LoginForm,
  ProFormCheckbox,
  ProFormText,
} from '@ant-design/pro-components';
import { Helmet } from '@umijs/max';
import { Alert } from 'antd';
import { MessageProxy } from '@/shared/antd_app_bridge';
import { createStyles } from 'antd-style';
import React, { useState } from 'react';
import { Footer } from '@/components';
import { login } from '@/services/ant-design-pro/api';
import { setAccessToken } from '@/shared/auth/tokenMemory';
import Settings from '../../../../config/defaultSettings';
// Definición mínima de estilos para la página de login
const useStyles = createStyles(({ token }) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: token?.colorBgLayout,
  },
}));

const Lang = () => {
  // Temporalmente deshabilitado para mitigar el error de HMR/locale
  return null;
};

const LoginMessage: React.FC<{
  content: string;
}> = ({ content }) => {
  return (
    <Alert
      style={{
        marginBottom: 24,
      }}
      message={content}
      type="error"
      showIcon
    />
  );
};

const Login: React.FC = () => {
  const [userLoginState, setUserLoginState] = useState<API.LoginResult>({});
  // Únicamente se admite login por cuenta (usuario/contraseña)
  const { styles } = useStyles();

  const handleSubmit = async (values: API.LoginParams) => {
    try {
      // Autenticación contra backend Flask
      const payload = {
        email: (values as any).username,
        password: (values as any).password,
        type: 'account',
      };
      const resp = await login(payload as any);
      // Guardar tokens si están presentes
      const accessToken = (resp as any)?.access_token || (resp as any)?.data?.access_token;
      if (accessToken) {
        // Almacenar bajo la clave estándar y mantener compatibilidad con clave heredada
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('token', accessToken);
        // Mantener token en memoria para evitar condición de carrera en la primera carga
        setAccessToken(accessToken);
      }
      const ok = (resp as any)?.status === 'ok' || !!accessToken;
      if (ok) {
        // Usar MessageProxy para evitar el warning de antd v5 sobre funciones estáticas
        MessageProxy.success('Inicio de sesión exitoso');
        const urlParams = new URL(window.location.href).searchParams;
        // Redirigir a dashboard/analysis (lowercase) por compatibilidad con rutas definidas
        window.location.href = urlParams.get('redirect') || '/dashboard/analysis';
        return;
      }
      setUserLoginState(resp as any);
    } catch (error) {
      // Usar MessageProxy para evitar el warning de antd v5 sobre funciones estáticas
      MessageProxy.error('Inicio de sesión fallido, por favor intenta de nuevo');
    }
  };
  const { status, type: loginType } = userLoginState;

  return (
    <div className={styles.container}>
      <Helmet>
        <title>
          Iniciar sesión{Settings.title ? ` - ${Settings.title}` : ''}
        </title>
      </Helmet>
      <Lang />
      <div
        style={{
          flex: '1',
          padding: '32px 0',
        }}
      >
        <LoginForm
          submitter={{
            searchConfig: {
              submitText: 'Iniciar sesión',
            },
          }}
          contentStyle={{
            minWidth: 280,
            maxWidth: '75vw',
          }}
          logo={<img alt="logo" src="/logo.svg" />}
          title="Iniciar Sesión"
          subTitle={'Velzia - Plataforma de comercio electrónico'}
          initialValues={{
            autoLogin: true,
          }}
          onFinish={async (values) => {
            await handleSubmit(values as API.LoginParams);
          }}
        >
          {/* Solo login con cuenta */}

          {status === 'error' && loginType === 'account' && (
            <LoginMessage content={'Correo o contraseña incorrectos'} />
          )}
          {true && (
            <>
              <ProFormText
                name="username"
                fieldProps={{
                  size: 'large',
                  prefix: <UserOutlined />,
                }}
                placeholder={'Correo electrónico'}
                rules={[
                  {
                    required: true,
                    message: 'Por favor ingresa tu correo',
                  },
                ]}
              />
              <ProFormText.Password
                name="password"
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined />,
                }}
                placeholder={'Contraseña'}
                rules={[
                  {
                    required: true,
                    message: 'Por favor ingresa tu contraseña',
                  },
                ]}
              />
            </>
          )}

          {/* Eliminado login por teléfono: no implementado en backend */}
          <div
            style={{
              marginBottom: 24,
            }}
          >
            <ProFormCheckbox noStyle name="autoLogin">
              Recordarme
            </ProFormCheckbox>
            <a
              style={{
                float: 'right',
              }}
            >
              Olvidé mi contraseña
            </a>
          </div>
        </LoginForm>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
