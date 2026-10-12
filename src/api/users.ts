import { apiClient } from '../lib/api'
import type { AppUser, UserRole } from '../types'

type ApiUser = {
  uid: string
  name: string
  role: UserRole
  group_id: string | null
  phone: string | null
  diocese_id: string | null
}

export const fetchAllUsers = () =>
  apiClient.get<ApiUser[]>('/v1/users').then(r =>
    r.data.map(u => ({
      uid: u.uid,
      name: u.name,
      role: u.role,
      groupId: u.group_id,
      phone: u.phone,
      dioceseId: u.diocese_id,
      fcmToken: null,
      mustChangePassword: 0,
      createdAt: '',
      updatedAt: '',
    }) as AppUser)
  )

export const updateUserRole = (uid: string, role: UserRole) =>
  apiClient.put(`/v1/users/${uid}/role`, { role }).then(r => r.data)

export const updateUserGroup = (uid: string, groupId: string | null) =>
  apiClient.put(`/v1/users/${uid}/group`, { group_id: groupId }).then(r => r.data)

export const updateUserDiocese = (uid: string, dioceseId: string | null) =>
  apiClient.put(`/v1/users/${uid}/diocese`, { diocese_id: dioceseId }).then(r => r.data)

export const createUser = (name: string, email: string, role: string) =>
  apiClient.post<{ uid: string; temp_password: string }>('/v1/users', { name, email, role }).then(r => r.data)
