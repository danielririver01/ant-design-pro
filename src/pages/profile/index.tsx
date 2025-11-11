import React from 'react';
import { PageContainer, ProForm, ProFormText, ProFormSelect } from '@ant-design/pro-components';
import { MessageProxy } from '@/shared/antd_app_bridge';
import { request } from '@umijs/max';

const ProfilePage: React.FC = () => {
  return (
    <PageContainer title="Perfil">
      <ProForm
        onFinish={async (values) => {
          try {
            await request('/profile', { method: 'PUT', data: values });
            MessageProxy.success('Perfil actualizado');
          } catch (e) {
            MessageProxy.error('No se pudo actualizar el perfil');
          }
        }}
        request={async () => {
          const res = await request('/profile', { method: 'GET' });
          return res?.data || {};
        }}
      >
        <ProFormText name="name" label="Nombre" rules={[{ required: true }]} />
        <ProFormText name="email" label="Correo" rules={[{ required: true, type: 'email' }]} />
        <ProFormSelect
          name="language"
          label="Idioma"
          options={[
            { label: 'Español', value: 'es-ES' },
            { label: 'Inglés', value: 'en-US' },
          ]}
        />
      </ProForm>
    </PageContainer>
  );
};

export default ProfilePage;