// src/@types/map.ts

import { User, UserRole } from '@/@types/user'
import { City } from '@/@types/city'
import { DemandStatus } from '@/@types/demand'
import { Visit } from '@/@types/visit'

export interface MapFilters {
  cityId?: string
  userType?: UserRole[]
  bairro?: string
  vereadorId?: string
  demandStatus?: DemandStatus
}

export interface RecentVisit {
  id: string
  dateTime: string
  reason: string
  status: string
}

export interface MapPoint {
  id: string
  latitude: number
  longitude: number
  type: UserRole
  user: User
  recentDemands: number
  recentVisits: RecentVisit[]
  demandsStatus?: DemandStatus // Calculado dinamicamente
}

export interface SideCardData {
  user: User
  recentDemands: number
  recentVisits: RecentVisit[]
  electoralBase?: number
  linkedVoters?: number
}
