import { apiClient } from '../lib/api'
import type { AppLocation, LocationType } from '../types'

export const fetchLocations = () =>
  apiClient.get<AppLocation[]>('/v1/locations').then(response => response.data)

export type LocationInput = {
  name: string
  type: LocationType
  lat: number
  lng: number
  description?: string
}

export const createLocation = (input: LocationInput) =>
  apiClient.post<AppLocation>('/v1/locations', input).then(response => response.data)

export const updateLocation = (id: string, input: LocationInput) =>
  apiClient.put<AppLocation>(`/v1/locations/${id}`, input).then(response => response.data)

export const deleteLocation = (id: string) =>
  apiClient.delete(`/v1/locations/${id}`).then(() => undefined)
