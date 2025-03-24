// src/screens/DashboardV1/views/DashboardInicial/index.tsx

import React from 'react'
import { useDashboard } from '@/contexts/DashboardProvider'
import { Card, Row, Col, Spin, Alert, List, Tag, Typography } from 'antd'
import { Bar, Pie, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js'
import { UserRole, getRoleData, getStatusData } from '@/@types/user'
import { CityStatus, getCityStatusData } from '@/@types/city'
import { Demand, DemandStatus, getDemandStatusData } from '@/@types/demand'
import { Visit, VisitStatus, getVisitStatusData } from '@/@types/visit'
import { Ticket, TicketStatus, getTicketStatusData } from '@/@types/tickets'
import moment from 'moment'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
)

const { Title: AntTitle, Text } = Typography

const InitialView: React.FC = () => {
  const { dashboardData, loading, error } = useDashboard()

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert
        message="Erro"
        description={error}
        type="error"
        showIcon
        style={{ margin: '20px' }}
      />
    )
  }

  if (!dashboardData) {
    return (
      <Alert
        message="Sem Dados"
        description="Nenhum dado foi encontrado. Comece adicionando usuários, cidades ou outras informações na plataforma."
        type="info"
        showIcon
      />
    )
  }

  // Prepare data for charts
  const userRoleChartData = {
    labels: Object.keys(dashboardData.userRoleDistribution).map(
      (role) => getRoleData(role as UserRole).label
    ),
    datasets: [
      {
        label: 'Distribuição de Usuários por Cargo',
        data: Object.values(dashboardData.userRoleDistribution),
        backgroundColor: Object.keys(dashboardData.userRoleDistribution).map(
          (role) => getRoleData(role as UserRole).color
        )
      }
    ]
  }

  const cityStatusChartData = {
    labels: Object.keys(dashboardData.cityStatusDistribution).map(
      (status) => getCityStatusData(status as CityStatus).label
    ),
    datasets: [
      {
        label: 'Distribuição de Cidades por Status',
        data: Object.values(dashboardData.cityStatusDistribution),
        backgroundColor: Object.keys(dashboardData.cityStatusDistribution).map(
          (status) => getCityStatusData(status as CityStatus).color
        )
      }
    ]
  }

  const demandStatusChartData = {
    labels: Object.keys(dashboardData.demandStatusDistribution).map(
      (status) => getDemandStatusData(status as DemandStatus).label
    ),
    datasets: [
      {
        label: 'Distribuição de Demandas por Status',
        data: Object.values(dashboardData.demandStatusDistribution),
        backgroundColor: Object.keys(
          dashboardData.demandStatusDistribution
        ).map((status) => getDemandStatusData(status as DemandStatus).color)
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const
      },
      title: {
        display: true
      }
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <AntTitle level={2}>Visão Geral da Plataforma</AntTitle>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card title="Total de Usuários (Não Eleitores)">
            <Text strong>{dashboardData.totalUsers}</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card title="Cidades Ativas">
            <Text strong>{dashboardData.totalCities}</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card title="Demandas Ativas">
            <Text strong>{dashboardData.totalActiveDemands}</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card title="Visitas Agendadas">
            <Text strong>{dashboardData.totalScheduledVisits}</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card title="Tickets Abertos">
            <Text strong>{dashboardData.totalOpenTickets}</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card title="Segmentos Ativos">
            <Text strong>{dashboardData.totalActiveSegments}</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card title="Enquetes Ativas">
            <Text strong>{dashboardData.totalActivePolls}</Text>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col xs={24} md={12}>
          <Card title="Distribuição de Usuários por Cargo">
            <Bar
              data={userRoleChartData}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  title: { display: false }
                }
              }}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Distribuição de Cidades por Status">
            <Pie
              data={cityStatusChartData}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  title: { display: false }
                }
              }}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Distribuição de Demandas por Status">
            <Pie
              data={demandStatusChartData}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  title: { display: false }
                }
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="Demandas Recentes">
            <List
              dataSource={dashboardData.recentActivity.recentDemands}
              renderItem={(demand: Demand) => (
                <List.Item>
                  <List.Item.Meta
                    title={`Protocolo: ${demand.protocol}`}
                    description={
                      <>
                        <Text>{demand.description}</Text>
                        <br />
                        <Tag color={getDemandStatusData(demand.status).color}>
                          {getDemandStatusData(demand.status).label}
                        </Tag>
                        <Text type="secondary">
                          Criado em:{' '}
                          {moment(demand.createdAt).format('DD/MM/YYYY HH:mm')}
                        </Text>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Visitas Recentes">
            <List
              dataSource={dashboardData.recentActivity.recentVisits}
              renderItem={(visit: Visit) => (
                <List.Item>
                  <List.Item.Meta
                    title={`Motivo: ${visit.details.reason}`}
                    description={
                      <>
                        <Text>
                          Data:{' '}
                          {moment(visit.dateTime).format('DD/MM/YYYY HH:mm')}
                        </Text>
                        <br />
                        <Tag color={getVisitStatusData(visit.status).color}>
                          {getVisitStatusData(visit.status).label}
                        </Tag>
                        <Text type="secondary">
                          Criado em:{' '}
                          {moment(visit.createdAt).format('DD/MM/YYYY HH:mm')}
                        </Text>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Tickets Recentes">
            <List
              dataSource={dashboardData.recentActivity.recentTickets}
              renderItem={(ticket: Ticket) => (
                <List.Item>
                  <List.Item.Meta
                    title={`Protocolo: ${ticket.protocol}`}
                    description={
                      <>
                        <Text>{ticket.title}</Text>
                        <br />
                        <Tag color={getTicketStatusData(ticket.status).color}>
                          {getTicketStatusData(ticket.status).label}
                        </Tag>
                        <Text type="secondary">
                          Criado em:{' '}
                          {moment(ticket.createdAt).format('DD/MM/YYYY HH:mm')}
                        </Text>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default InitialView
