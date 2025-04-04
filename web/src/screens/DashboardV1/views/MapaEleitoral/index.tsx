// src/screens/DashboardV1/views/MapaEleitoral/index.tsx

import { useState } from 'react'
import { Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import { View } from '@/components'
import { useAuth } from '@/contexts/AuthProvider'
import { useCities } from '@/contexts/CitiesProvider'
import { useUsers } from '@/contexts/UsersProvider'
import { useMap } from '@/contexts/MapProvider'
import {
  Modal,
  MapComponent,
  FiltersPanel,
  SideCard,
  Legend
} from '@/components'
import { DemandRegistrationForm } from '@/components'
import { DemandRegistrationFormType } from '@/@types/demand'
import { useDemands } from '@/contexts/DemandsProvider'
import * as S from './styles'
import { UserRole } from '@/@types/user'
import { SideCardData } from '@/@types/map'

const MapaEleitoralView = () => {
  const { user } = useAuth()
  const { cities } = useCities()
  const { users, getUserById } = useUsers()
  const { createDemand } = useDemands()
  const { mapPoints, filters, setFilters, loading } = useMap()
  const navigate = useNavigate()

  const [selectedPoint, setSelectedPoint] = useState<SideCardData | null>(null)
  const [isCreateDemandModalOpen, setIsCreateDemandModalOpen] = useState(false)
  const [sideCardData, setSideCardData] = useState<SideCardData | null>(null)

  const handleMarkerClick = (point: SideCardData) => {
    setSelectedPoint(point)
    setSideCardData(point)
  }

  const handleCreateDemand = async (data: DemandRegistrationFormType) => {
    if (selectedPoint) {
      await createDemand(data)
      setIsCreateDemandModalOpen(false)
    }
  }

  const handleRegisterVisit = () => {
    if (selectedPoint) {
      navigate('/dashboard/registro-visitas', {
        state: { voterId: selectedPoint.user.id }
      })
    }
  }

  const handleViewHistory = () => {
    if (selectedPoint) {
      navigate(`/dashboard/historico-eleitor/${selectedPoint.user.id}`)
    }
  }

  const handleGenerateReport = () => {
    // Placeholder: lógica de geração de relatório será implementada no ReportGenerator
  }

  const allowedCityIds =
    user?.role === UserRole.ADMINISTRADOR_GERAL
      ? cities
          .map((city) => city.id)
          .filter((id): id is string => id !== undefined)
      : user?.cityId
      ? [user.cityId]
      : []

  return (
    <View
      header={
        <S.HeaderWrapper>
          <FiltersPanel
            filters={filters}
            setFilters={setFilters}
            cities={cities}
            allowedCityIds={allowedCityIds}
            users={users}
          />
          <S.ActionButtons>
            <Button type="primary" onClick={handleGenerateReport} disabled>
              Gerar Relatório Geográfico
            </Button>
          </S.ActionButtons>
        </S.HeaderWrapper>
      }
    >
      <S.MapContainer>
        <MapComponent
          points={mapPoints}
          onMarkerClick={handleMarkerClick}
          loading={loading}
        />
        <Legend />
        {selectedPoint && sideCardData && (
          <SideCard
            data={sideCardData}
            onClose={() => {
              setSelectedPoint(null)
              setSideCardData(null)
            }}
            onViewHistory={handleViewHistory}
          />
        )}
      </S.MapContainer>

      <Modal
        title="Criação de Nova Demanda"
        open={isCreateDemandModalOpen}
        onCancel={() => setIsCreateDemandModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        {isCreateDemandModalOpen && selectedPoint && (
          <DemandRegistrationForm
            onSubmit={handleCreateDemand}
            mode="create"
            initialData={{
              voterId: selectedPoint.user.id,
              cityId: selectedPoint.user.cityId
            }}
            currentStep={0}
            setCurrentStep={() => {}}
            loading={false}
          />
        )}
      </Modal>
    </View>
  )
}

export default MapaEleitoralView
