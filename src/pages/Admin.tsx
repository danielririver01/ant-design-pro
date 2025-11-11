import React, { useEffect, useState } from 'react';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { Statistic, Row, Col } from 'antd';
import { request } from '@umijs/max';

const AdminPage: React.FC = () => {
  const [kpis, setKpis] = useState<{ orders: number; revenue: number; clients: number }>({ orders: 0, revenue: 0, clients: 0 });

  useEffect(() => {
    (async () => {
      try {
        const res = await request('/kpis', { method: 'GET' });
        setKpis(res?.data || { orders: 0, revenue: 0, clients: 0 });
      } catch (e) {
        // Silenciar en primera carga
      }
    })();
  }, []);

  return (
    <PageContainer title="Panel Administrativo">
      <ProCard>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Statistic title="Pedidos" value={kpis.orders} />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic title="Clientes" value={kpis.clients} />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic title="Ingresos" prefix="$" value={kpis.revenue} precision={2} />
          </Col>
        </Row>
      </ProCard>
    </PageContainer>
  );
};

export default AdminPage;
