import { apiClient } from '../lib/api'
import type { AppUser, UserRole } from '../types'

export const fetchAllUsers = () =>
  apiClient.get<AppUser[]>('/v1/users/').then(r => r.data)

export const updateUserRole = (uid: string, role: UserRole) =>
  apiClient.put(`/v1/users/${uid}/role`, { role }).then(r => r.data)

export const updateUserGroup = (uid: string, groupId: string | null) =>
  apiClient.put(`/v1/users/${uid}/group`, { group_id: groupId }).then(r => r.data)

export const createUser = (name: string, email: string, role: string) =>
  apiClient.post<{ uid: string; temp_password: string }>('/v1/users/', { name, email, role }).then(r => r.data)
