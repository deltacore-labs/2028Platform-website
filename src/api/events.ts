import { apiClient } from '../lib/api'
import type { AppEvent, UserRole } from '../types'

export const fetchEvents = () =>
  apiClient.get<AppEvent[]>('/v1/events').then(r => r.data)

export const createEvent = (payload: {
  title: string
  description?: string
  start_date: number
  end_date: number
  target_roles?: UserRole[]
  group_id?: string
}) => apiClient.post<AppEvent>('/v1/events', payload).then(r => r.data)
