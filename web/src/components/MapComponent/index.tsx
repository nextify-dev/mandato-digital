// src/components/MapComponent/index.tsx

import { useState, useMemo } from 'react'
import {
  GoogleMap,
  Marker,
  InfoWindow,
  MarkerClusterer,
  useJsApiLoader
} from '@react-google-maps/api'
import { MapPoint } from '@/@types/map'
import { UserRole } from '@/@types/user'
import * as S from './styles'

// Configuração das opções do mapa
const mapOptions = {
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true
}

// Função para obter a cor do marcador com base no tipo de usuário
const getMarkerColor = (type: UserRole): string => {
  switch (type) {
    case UserRole.ADMINISTRADOR_GERAL:
    case UserRole.ADMINISTRADOR_CIDADE:
      return '#FF0000' // Vermelho
    case UserRole.PREFEITO:
      return '#800080' // Roxo
    case UserRole.VEREADOR:
      return '#FFFF00' // Amarelo
    case UserRole.CABO_ELEITORAL:
      return '#FFA500' // Laranja
    case UserRole.ELEITOR:
      return '#0000FF' // Azul
    default:
      return '#808080' // Cinza
  }
}

// Função para criar um ícone SVG personalizado
const createMarkerIcon = (color: string) => ({
  url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <path fill="${color}" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5z"/>
    </svg>
  `)}`,
  scaledSize: new window.google.maps.Size(32, 32)
})

interface MapComponentProps {
  points: MapPoint[]
  onMarkerClick: (point: MapPoint) => void
  loading: boolean
}

const MapComponent: React.FC<MapComponentProps> = ({
  points,
  onMarkerClick,
  loading
}) => {
  // Carregar a API do Google Maps
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API || ''
  })

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

  if (!isLoaded || loading) {
    return <S.LoadingWrapper>Carregando mapa...</S.LoadingWrapper>
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100%' }}
      center={center}
      zoom={13}
      options={mapOptions}
    >
      <MarkerClusterer averageCenter enableRetinaIcons gridSize={60}>
        {(clusterer) => (
          <>
            {points.map((point) => (
              <Marker
                key={point.id}
                position={{ lat: point.latitude, lng: point.longitude }}
                icon={createMarkerIcon(getMarkerColor(point.type))}
                clusterer={clusterer}
                onClick={() => onMarkerClick(point)}
                onMouseOver={() => setHoveredMarker(point)}
                onMouseOut={() => setHoveredMarker(null)}
              >
                {hoveredMarker?.id === point.id && (
                  <InfoWindow onCloseClick={() => setHoveredMarker(null)}>
                    <div>
                      <strong>{point.user.profile?.nomeCompleto}</strong>
                      <br />
                      Endereço: {point.user.profile?.endereco},{' '}
                      {point.user.profile?.numero}
                      <br />
                      Telefone: {point.user.profile?.telefone || 'N/A'}
                      <br />
                      {point.type === UserRole.ELEITOR &&
                        point.user.vereadorId && (
                          <>
                            Relacionado a: Vereador{' '}
                            {point.user.vereadorId
                              ? point.user
                                  .vereadorId /* Substitua por nome real */
                              : 'N/A'}
                          </>
                        )}
                      {point.type === UserRole.VEREADOR && (
                        <>Base Eleitoral: {/* Calcular tamanho da base */}</>
                      )}
                      {point.type === UserRole.CABO_ELEITORAL && (
                        <>Eleitores Vinculados: {/* Calcular número */}</>
                      )}
                    </div>
                  </InfoWindow>
                )}
              </Marker>
            ))}
          </>
        )}
      </MarkerClusterer>
    </GoogleMap>
  )
}

export default MapComponent
