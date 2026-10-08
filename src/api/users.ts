import { apiClient } from '../lib/api'
import type { AppUser, UserRole } from '../types'

interface RawUser {
  uid: string
  name: string
  role: UserRole
  group_id: string | null
  phone: string | null
  diocese_id: string | null
}

export const fetchAllUsers = () =>
  apiClient.get<RawUser[]>('/v1/users').then(r =>
    r.data.map((u): AppUser => ({
      uid: u.uid,
      name: u.name,
      role: u.role,
      groupId: u.group_id,
      phone: u.phone,
      fcmToken: null,
      mustChangePassword: 0,
      createdAt: '',
      updatedAt: '',
    }))
  )

export const updateUserRole = (uid: string, role: UserRole) =>
  apiClient.put(`/v1/users/${uid}/role`, { role }).then(r => r.data)

export const updateUserGroup = (uid: string, groupId: string | null) =>
  apiClient.put(`/v1/users/${uid}/group`, { group_id: groupId }).then(r => r.data)

export const createUser = (name: string, email: string, role: string) =>
  apiClient.post<{ uid: string; temp_password: string }>('/v1/users', { name, email, role }).then(r => r.data)
