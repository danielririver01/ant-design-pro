import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, Row, Statistic, List, Progress, Typography, Space, Spin, Empty, Alert } from 'antd';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { MessageProxy } from '@/shared/antd_app_bridge';
import { formatCOP } from '@/shared/utils/currency';
import { 
  getAnnualSales, 
  getKPIs, 
  getMonthlySales, 
  getPopularSearches, 
  getSalesByCategory, 
  type KPIsResponse, 
  type SeriesResponse, 
  type PopularSearchItem 
} from '@/services/analysis_service';

const { Title, Text } = Typography;

/**
 * Error Boundary para gráficos
 */
class ChartErrorBoundary extends React.Component<
  { children: React.ReactNode; fallbackTitle: string },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('🔴 Chart Error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🔴 Chart Error Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <Alert
            message={`Error en ${this.props.fallbackTitle}`}
            description="No fue posible renderizar el gráfico. Por favor, recarga la página."
            type="error"
            showIcon
          />
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Dashboard de Análisis (conexión a API en tiempo real)
 * - KPIs y totales de ventas en COP
 * - Ventas por mes (BarChart)
 * - Ventas anuales (LineChart)
 * - Ventas por categoría (PieChart)
 * - Ranking de búsqueda
 */
const AnalysisPage: React.FC = () => {
  // Estados de carga
  const [loading, setLoading] = useState({ 
    kpis: true, 
    monthly: true, 
    annual: true, 
    categories: true, 
    ranking: true 
  });

  // Datos
  const [kpis, setKpis] = useState<KPIsResponse | null>(null);
  const [monthlySales, setMonthlySales] = useState<SeriesResponse | null>(null);
  const [annualSales, setAnnualSales] = useState<SeriesResponse | null>(null);
  const [categorySales, setCategorySales] = useState<SeriesResponse | null>(null);
  const [popularSearches, setPopularSearches] = useState<PopularSearchItem[]>([]);

  // Totales
  const totalSalesCOP = useMemo(() => 
    (monthlySales?.valores || []).reduce((acc, v) => acc + (v || 0), 0), 
    [monthlySales]
  );

  // Auto-actualización cada 5 minutos
  const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
  const refreshTimerRef = useRef<number | null>(null);

  const loadData = async () => {
    // KPIs
    try {
      const k = await getKPIs();
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analysis] KPIs:', k);
      }
      setKpis(k);
    } catch (err) {
      console.error('[Analysis] Error loading KPIs:', err);
      MessageProxy.error('No fue posible cargar los KPIs.');
    } finally {
      setLoading((s) => ({ ...s, kpis: false }));
    }

    // Ventas mensuales
    try {
      const m = await getMonthlySales();
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analysis] Ventas mensuales:', m);
      }
      setMonthlySales(m);
    } catch (err) {
      console.error('[Analysis] Error loading monthly sales:', err);
      MessageProxy.error('No fue posible cargar las ventas mensuales.');
    } finally {
      setLoading((s) => ({ ...s, monthly: false }));
    }

    // Ventas anuales
    try {
      const a = await getAnnualSales();
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analysis] Ventas anuales:', a);
      }
      setAnnualSales(a);
    } catch (err) {
      console.error('[Analysis] Error loading annual sales:', err);
      MessageProxy.error('No fue posible cargar las ventas anuales.');
    } finally {
      setLoading((s) => ({ ...s, annual: false }));
    }

    // Ventas por categoría
    try {
      const c = await getSalesByCategory();
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analysis] Ventas por categoría:', c);
      }
      setCategorySales(c);
    } catch (err) {
      console.error('[Analysis] Error loading category sales:', err);
      MessageProxy.error('No fue posible cargar las ventas por categoría.');
    } finally {
      setLoading((s) => ({ ...s, categories: false }));
    }

    // Ranking de búsqueda
    try {
      const r = await getPopularSearches();
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analysis] Ranking de búsqueda:', r);
      }
      setPopularSearches(r?.data || []);
    } catch (err) {
      console.error('[Analysis] Error loading popular searches:', err);
      MessageProxy.error('No fue posible cargar el ranking de búsqueda.');
    } finally {
      setLoading((s) => ({ ...s, ranking: false }));
    }
  };

  useEffect(() => {
    loadData();
    if (!refreshTimerRef.current) {
      const id = window.setInterval(loadData, REFRESH_INTERVAL_MS);
      refreshTimerRef.current = id as unknown as number;
    }
    return () => {
      if (refreshTimerRef.current) {
        window.clearInterval(refreshTimerRef.current);
      }
    };
  }, []);

  // Datos transformados para Recharts - Ventas mensuales
  const monthlyChartData = useMemo(() => {
    if (!monthlySales?.labels?.length || !monthlySales?.valores?.length) {
      return [];
    }
    return monthlySales.labels.map((label, idx) => ({
      month: String(label),
      value: monthlySales.valores[idx] || 0,
    }));
  }, [monthlySales]);

  // Datos transformados para Recharts - Ventas anuales
  const annualChartData = useMemo(() => {
    if (!annualSales?.labels?.length || !annualSales?.valores?.length) {
      return [];
    }
    return annualSales.labels.map((label, idx) => ({
      year: String(label),
      value: annualSales.valores[idx] || 0,
    }));
  }, [annualSales]);

  // Datos transformados para Recharts - Ventas por categoría
  const categoryChartData = useMemo(() => {
    if (!categorySales?.labels?.length || !categorySales?.valores?.length) {
      return [];
    }
    return categorySales.labels.map((label, idx) => ({
      name: String(label),
      value: categorySales.valores[idx] || 0,
    }));
  }, [categorySales]);

  // Colores para gráfico de pastel
  const COLORS = ['#1677ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96'];

  // Tooltip personalizado para mostrar valores en COP
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: '#fff',
          border: '1px solid #d9d9d9',
          padding: '8px 12px',
          borderRadius: 4,
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
          <p style={{ margin: '4px 0 0', color: payload[0].color }}>
            Ventas: {formatCOP(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <PageContainer title="Análisis">
      {/* KPIs */}
      <Row gutter={[16, 16]}>
        {[
          { title: 'Ventas Totales (COP)', valueText: formatCOP(totalSalesCOP), loading: loading.monthly },
          { title: 'Pedidos', valueText: String(kpis?.pedidos?.total ?? 0), loading: loading.kpis },
          { title: 'Productos', valueText: String(kpis?.productos?.total ?? 0), loading: loading.kpis },
          { title: 'Clientes', valueText: String(kpis?.clientes?.total ?? 0), loading: loading.kpis },
        ].map((s) => (
          <Col key={s.title} xs={24} sm={12} md={12} lg={6} xl={6}>
            <Card>
              {s.loading ? (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <Spin />
                </div>
              ) : (
                <Statistic 
                  title={s.title} 
                  valueRender={() => <span style={{ fontSize: 24 }}>{s.valueText}</span>} 
                />
              )}
            </Card>
          </Col>
        ))}
      </Row>

      {/* Ventas mensuales + Ranking */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card 
            title={<Title level={5}>Ventas por mes</Title>}
            style={{ minHeight: 400 }}
          >
            {loading.monthly ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <Spin size="large" />
              </div>
            ) : monthlyChartData.length === 0 ? (
              <Empty description="No hay datos de ventas mensuales disponibles" />
            ) : (
              <ChartErrorBoundary fallbackTitle="Ventas por mes">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="value" fill="#1677ff" name="Ventas (COP)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartErrorBoundary>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card 
            title={<Title level={5}>Ranking de búsqueda</Title>}
            style={{ minHeight: 400 }}
          >
            {loading.ranking ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <Spin size="large" />
              </div>
            ) : popularSearches.length === 0 ? (
              <Empty description="No hay búsquedas disponibles" />
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={popularSearches.slice(0, 5)}
                renderItem={(item, index) => {
                  const maxCount = Math.max(...popularSearches.map(i => i.count || 0), 1);
                  const percent = Math.round(((item.count || 0) / maxCount) * 100);
                  return (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: index < 3 ? '#1677ff' : '#d9d9d9',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                          }}>
                            {index + 1}
                          </div>
                        }
                        title={item.query}
                        description={
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Text type="secondary">Búsquedas: {item.count}</Text>
                            <Progress percent={percent} size="small" />
                          </Space>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Ventas anuales + Categorías */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card 
            title={<Title level={5}>Ventas anuales</Title>}
            style={{ minHeight: 400 }}
          >
            {loading.annual ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <Spin size="large" />
              </div>
            ) : annualChartData.length === 0 ? (
              <Empty description="No hay datos de ventas anuales disponibles" />
            ) : (
              <ChartErrorBoundary fallbackTitle="Ventas anuales">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={annualChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Ventas (COP)"
                      dot={{ fill: '#10b981', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartErrorBoundary>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card 
            title={<Title level={5}>Distribución por categoría</Title>}
            style={{ minHeight: 400 }}
          >
            {loading.categories ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <Spin size="large" />
              </div>
            ) : categoryChartData.length === 0 ? (
              <Empty description="No hay datos de categorías disponibles" />
            ) : (
              <ChartErrorBoundary fallbackTitle="Distribución por categoría">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={90}
                      innerRadius={50}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => formatCOP(value)}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartErrorBoundary>
            )}
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default AnalysisPage;