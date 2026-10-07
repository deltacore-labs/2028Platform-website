import { apiClient } from '../lib/api'
import type { EmergencyReport, EmergencyStatus } from '../types'

export const fetchEmergencyReports = () =>
  apiClient.get<EmergencyReport[]>('/v1/emergency/reports').then(r => r.data)

export const updateEmergencyStatus = (id: string, status: EmergencyStatus) =>
  apiClient.put(`/v1/emergency/reports/${id}/status`, { status }).then(r => r.data)
