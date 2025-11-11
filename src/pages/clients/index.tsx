import React, { useRef } from 'react';
import { PageContainer, ProTable, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { MessageProxy } from '@/shared/antd_app_bridge';
import { request } from '@umijs/max';

interface ClientItem {
  id: number;
  email: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

const ClientsPage: React.FC = () => {
  const actionRef = useRef<ActionType>();

  const columns: ProColumns<ClientItem>[] = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Nombre', dataIndex: 'name' },
    { title: 'Activo', dataIndex: 'is_active', valueType: 'switch' },
    { title: 'Creado', dataIndex: 'created_at', valueType: 'dateTime' },
  ];

  return (
    <PageContainer title="Clientes">
      <ProTable<ClientItem>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        search={{ labelWidth: 'auto' }}
        pagination={{ pageSize: 10 }}
        request={async (params) => {
          try {
            const res = await request<{ data: ClientItem[]; total: number }>(`/clients`, {
              method: 'GET',
              params: {
                page: params.current,
                page_size: params.pageSize,
                q: params.keyword,
              },
            });
            return {
              data: res.data,
              success: true,
              total: res.total,
            };
          } catch (e) {
            MessageProxy.error('No se pudo cargar clientes');
            return { data: [], success: false, total: 0 };
          }
        }}
      />
    </PageContainer>
  );
};

export default ClientsPage;