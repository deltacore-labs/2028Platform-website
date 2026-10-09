import { apiClient } from '../lib/api'
import type { Diocese } from '../types'

export const fetchDioceses = () =>
  apiClient.get<Diocese[]>('/v1/dioceses').then(r => r.data)

export const createDiocese = (id: string, name: string) =>
  apiClient.post<Diocese>('/v1/dioceses', { id, name }).then(r => r.data)
