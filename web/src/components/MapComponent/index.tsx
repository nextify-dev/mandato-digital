// src/components/MapComponent/index.tsx

import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  APIProvider,
  Map,
  MapCameraChangedEvent,
  Pin,
  useMap,
  useMapsLibrary
} from '@vis.gl/react-google-maps'
import { MarkerClusterer } from '@googlemaps/markerclusterer'
import { MapPoint, SideCardData } from '@/@types/map'
import { UserRole } from '@/@types/user'
import * as S from './styles'

// Função para obter a cor do marcador com base no tipo de usuário
const getPinColor = (
  type: UserRole
): { background: string; glyphColor: string; borderColor: string } => {
  switch (type) {
    case UserRole.ADMINISTRADOR_GERAL:
    case UserRole.ADMINISTRADOR_CIDADE:
      return {
        background: '#FF0000',
        glyphColor: '#FFFFFF',
        borderColor: '#800000'
      } // Vermelho
    case UserRole.PREFEITO:
      return {
        background: '#800080',
        glyphColor: '#FFFFFF',
        borderColor: '#4B004B'
      } // Roxo
    case UserRole.VEREADOR:
      return {
        background: '#FFFF00',
        glyphColor: '#000000',
        borderColor: '#808000'
      } // Amarelo
    case UserRole.CABO_ELEITORAL:
      return {
        background: '#FFA500',
        glyphColor: '#FFFFFF',
        borderColor: '#804000'
      } // Laranja
    case UserRole.ELEITOR:
      return {
        background: '#0000FF',
        glyphColor: '#FFFFFF',
        borderColor: '#000080'
      } // Azul
    default:
      return {
        background: '#808080',
        glyphColor: '#FFFFFF',
        borderColor: '#404040'
      } // Cinza
  }
}

interface MapComponentProps {
  points: MapPoint[]
  onMarkerClick: (data: SideCardData) => void // Alterado para passar SideCardData
  loading: boolean
}

const MapComponent: React.FC<MapComponentProps> = ({
  points,
  onMarkerClick,
  loading
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API || ''
  const mapId = 'MAP_ELEITORAL_ID'

  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: -23.5505,
    lng: -46.6333 // São Paulo como padrão inicial
  })
  const [zoom, setZoom] = useState(10)
  const [hoveredMarker, setHoveredMarker] = useState<MapPoint | null>(null)

  // Calcular o centro do mapa com base nos pontos
  const center = useMemo(() => {
    if (points.length === 0) {
      return { lat: -23.5505, lng: -46.6333 } // São Paulo como padrão
    }
    const avgLat =
      points.reduce((sum, p) => sum + p.latitude, 0) / points.length
    const avgLng =
      points.reduce((sum, p) => sum + p.longitude, 0) / points.length
    return { lat: avgLat, lng: avgLng }
  }, [points])

  // Atualizar o centro do mapa quando os pontos mudarem
  useEffect(() => {
    setMapCenter(center)
  }, [center])

  const handleCenterChanged = useCallback((event: MapCameraChangedEvent) => {
    const newCenter = event.detail.center
    setMapCenter({ lat: newCenter.lat, lng: newCenter.lng })
  }, [])

  const handleZoomChanged = useCallback((event: MapCameraChangedEvent) => {
    setZoom(event.detail.zoom)
  }, [])

  // Função para calcular a base eleitoral (número de eleitores associados a um vereador)
  const calculateElectoralBase = (vereadorId: string): number => {
    return points.filter(
      (point) =>
        point.type === UserRole.ELEITOR && point.user.vereadorId === vereadorId
    ).length
  }

  // Função para calcular eleitores vinculados (número de eleitores associados a um cabo eleitoral)
  const calculateLinkedVoters = (caboEleitoralId: string): number => {
    return points.filter(
      (point) =>
        point.type === UserRole.ELEITOR &&
        point.user.caboEleitoralId === caboEleitoralId
    ).length
  }

  // Função para criar os dados do SideCardData ao clicar em um marcador
  const handleMarkerClick = (point: MapPoint) => {
    const sideCardData: SideCardData = {
      user: point.user,
      recentDemands: point.recentDemands || 0,
      recentVisits: point.recentVisits || [],
      electoralBase:
        point.type === UserRole.VEREADOR
          ? calculateElectoralBase(point.user.id)
          : undefined,
      linkedVoters:
        point.type === UserRole.CABO_ELEITORAL
          ? calculateLinkedVoters(point.user.id)
          : undefined
    }
    onMarkerClick(sideCardData)
  }

  if (!apiKey) {
    return (
      <S.LoadingWrapper>
        Erro: Chave da API do Google Maps não configurada.
      </S.LoadingWrapper>
    )
  }

  if (loading) {
    return <S.LoadingWrapper>Carregando mapa...</S.LoadingWrapper>
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        center={mapCenter}
        zoom={zoom}
        mapId={mapId}
        reuseMaps={true}
        onCenterChanged={handleCenterChanged}
        onZoomChanged={handleZoomChanged}
        style={{ width: '100%', height: '100%' }}
        gestureHandling="greedy"
        draggable={true}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={true}
      >
        <MarkersWithClustering
          points={points}
          onMarkerClick={handleMarkerClick}
          setHoveredMarker={setHoveredMarker}
        />
        {hoveredMarker && (
          <S.InfoBox>
            <strong>{hoveredMarker.user.profile?.nomeCompleto}</strong>
            <br />
            Endereço: {hoveredMarker.user.profile?.endereco},{' '}
            {hoveredMarker.user.profile?.numero}
            <br />
            Telefone: {hoveredMarker.user.profile?.telefone || 'N/A'}
            <br />
            {hoveredMarker.type === UserRole.ELEITOR &&
              hoveredMarker.user.vereadorId && (
                <>
                  Relacionado a: Vereador{' '}
                  {hoveredMarker.user.vereadorId
                    ? hoveredMarker.user
                        .vereadorId /* Substitua por nome real */
                    : 'N/A'}
                </>
              )}
            {hoveredMarker.type === UserRole.VEREADOR && (
              <>
                Base Eleitoral: {calculateElectoralBase(hoveredMarker.user.id)}
              </>
            )}
            {hoveredMarker.type === UserRole.CABO_ELEITORAL && (
              <>
                Eleitores Vinculados:{' '}
                {calculateLinkedVoters(hoveredMarker.user.id)}
              </>
            )}
          </S.InfoBox>
        )}
      </Map>
    </APIProvider>
  )
}

// Componente para gerenciar marcadores com clustering
interface MarkersWithClusteringProps {
  points: MapPoint[]
  onMarkerClick: (point: MapPoint) => void
  setHoveredMarker: (point: MapPoint | null) => void
}

const MarkersWithClustering: React.FC<MarkersWithClusteringProps> = ({
  points,
  onMarkerClick,
  setHoveredMarker
}) => {
  const map = useMap()
  const markerLibrary = useMapsLibrary('marker')
  const [clusterer, setClusterer] = useState<MarkerClusterer | null>(null)

  // Criar os marcadores
  const markers = useMemo(() => {
    if (!map || !markerLibrary) {
      console.log('Map or markerLibrary not ready yet')
      return []
    }

    console.log('Creating markers for points:', points)
    return points.map((point) => {
      const pinStyle = getPinColor(point.user.role)
      const marker = new markerLibrary.AdvancedMarkerElement({
        position: { lat: point.latitude, lng: point.longitude },
        map,
        content: new markerLibrary.PinElement({
          background: pinStyle.background,
          glyphColor: pinStyle.glyphColor,
          borderColor: pinStyle.borderColor
        }).element
      })

      marker.addListener('click', () => {
        console.log('Marker clicked:', point.id)
        onMarkerClick(point)
      })
      marker.addListener('mouseover', () => {
        console.log('Mouse over marker:', point.id)
        setHoveredMarker(point)
      })
      marker.addListener('mouseout', () => {
        console.log('Mouse out marker:', point.id)
        setHoveredMarker(null)
      })

      return marker
    })
  }, [points, map, markerLibrary, onMarkerClick, setHoveredMarker])

  // Configurar o MarkerClusterer
  useEffect(() => {
    if (!map || !markerLibrary || markers.length === 0) {
      console.log(
        'Skipping MarkerClusterer setup: map, markerLibrary, or markers not ready'
      )
      return
    }

    console.log('Setting up MarkerClusterer with markers:', markers.length)

    if (clusterer) {
      console.log('Clearing previous clusterer')
      clusterer.clearMarkers()
    }

    const newClusterer = new MarkerClusterer({
      map,
      markers,
      renderer: {
        render: ({ count, position }) => {
          console.log('Rendering cluster marker with count:', count)
          return new markerLibrary.AdvancedMarkerElement({
            position,
            content: new markerLibrary.PinElement({
              background: '#FFD700',
              glyphColor: '#000000',
              borderColor: '#DAA520',
              glyph: count.toString()
            }).element
          })
        }
      }
    })

    setClusterer(newClusterer)

    return () => {
      console.log('Cleaning up MarkerClusterer')
      newClusterer.clearMarkers()
    }
  }, [map, markerLibrary, markers])

  return null
}

export default MapComponent
