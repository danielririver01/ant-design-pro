import React, { useRef } from 'react';
import { PageContainer, ProTable, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Tag } from 'antd';
import { MessageProxy } from '@/shared/antd_app_bridge';
import { request } from '@umijs/max';

interface OrderItem {
  id: number;
  status: string;
  total_amount: number;
  created_at: string;
  client_email: string;
}

const OrdersPage: React.FC = () => {
  const actionRef = useRef<ActionType>();

  const columns: ProColumns<OrderItem>[] = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: 'Cliente', dataIndex: 'client_email' },
    { title: 'Total', dataIndex: 'total_amount', valueType: 'money' },
    {
      title: 'Estado',
      dataIndex: 'status',
      render: (_, row) => <Tag>{row.status}</Tag>,
      filters: true,
      onFilter: true,
    },
    { title: 'Fecha', dataIndex: 'created_at', valueType: 'dateTime' },
  ];

  return (
    <PageContainer title="Pedidos">
      <ProTable<OrderItem>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        search={{ labelWidth: 'auto' }}
        pagination={{ pageSize: 10 }}
        request={async (params, sort, filter) => {
          try {
            const res = await request<{ data: OrderItem[]; total: number }>(`/orders`, {
              method: 'GET',
              params: {
                page: params.current,
                page_size: params.pageSize,
                status: filter?.status?.toString(),
                from: params?.from,
                to: params?.to,
              },
            });
            return {
              data: res.data,
              success: true,
              total: res.total,
            };
          } catch (e) {
            MessageProxy.error('No se pudo cargar pedidos');
            return { data: [], success: false, total: 0 };
          }
        }}
      />
    </PageContainer>
  );
};

export default OrdersPage;