// src/@types/map.ts

import { User, UserRole } from '@/@types/user'
import { City } from '@/@types/city'
import { DemandStatus } from '@/@types/demand'
import { Visit } from '@/@types/visit'

export interface MapPoint {
  id: string
  user: User
  latitude: number
  longitude: number
  type: UserRole
  demandsStatus?: DemandStatus
}

export interface MapFilters {
  cityId?: string
  userType?: UserRole[]
  bairro?: string
  vereadorId?: string
  demandStatus?: DemandStatus
}

export interface SideCardData {
  user: User
  recentDemands: number
  recentVisits: Visit[]
}

export interface Coordinates {
  lat: number
  lng: number
}
