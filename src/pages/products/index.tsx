import React, { useRef } from 'react';
import { PageContainer, ProTable, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Image, Switch } from 'antd';
import { MessageProxy } from '@/shared/antd_app_bridge';
import { request } from '@umijs/max';

interface ProductItem {
  id: number;
  name: string;
  sku: string;
  price: number;
  is_active: boolean;
  image_url?: string;
}

const ProductsPage: React.FC = () => {
  const actionRef = useRef<ActionType>();

  const columns: ProColumns<ProductItem>[] = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: 'Nombre', dataIndex: 'name' },
    { title: 'SKU', dataIndex: 'sku' },
    { title: 'Precio', dataIndex: 'price', valueType: 'money' },
    {
      title: 'Activo',
      dataIndex: 'is_active',
      render: (_, row) => <Switch checked={row.is_active} disabled />,
    },
    {
      title: 'Imagen',
      dataIndex: 'image_url',
      render: (_, row) => row.image_url ? <Image src={row.image_url} width={40} /> : null,
    },
  ];

  return (
    <PageContainer title="Productos">
      <ProTable<ProductItem>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        search={{ labelWidth: 'auto' }}
        pagination={{ pageSize: 10 }}
        request={async (params) => {
          try {
            const res = await request<{ data: ProductItem[]; total: number }>(`/products`, {
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
            MessageProxy.error('No se pudo cargar productos');
            return { data: [], success: false, total: 0 };
          }
        }}
      />
    </PageContainer>
  );
};

export default ProductsPage;