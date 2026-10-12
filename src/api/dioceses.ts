import { apiClient } from '../lib/api'
import type { Diocese } from '../types'

export const fetchDioceses = () =>
  apiClient.get<Diocese[]>('/v1/dioceses').then(r => r.data)

export const createDiocese = (id: string, name: string) =>
  apiClient.post<Diocese>('/v1/dioceses', { id, name }).then(r => r.data)

export const updateDiocese = (id: string, name: string) =>
  apiClient.put<Diocese>(`/v1/dioceses/${id}`, { name }).then(r => r.data)

export const deleteDiocese = (id: string) =>
  apiClient.delete(`/v1/dioceses/${id}`).then(r => r.data)
