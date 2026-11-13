import { apiClient } from '../lib/api'
import type { AppUser, UserRole } from '../types'

type ApiUser = {
  uid: string
  name: string
  role: UserRole
  group_id: string | null
  phone: string | null
  diocese_id: string | null
  matrix_user_id: string | null
  matrix_username: string | null
  has_account: boolean
  blocked: number
  show_in_contacts: boolean
  last_seen_at: number | null
}

export type CreateUserResult = {
  uid: string
  temp_password: string
  matrix: null | {
    created: boolean
    user_id?: string
    username: string
    temp_password?: string
    error?: string | null
  }
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
      matrixUserId: u.matrix_user_id ?? null,
      matrixUsername: u.matrix_username ?? null,
      hasAccount: u.has_account ?? true,
      fcmToken: null,
      mustChangePassword: 0,
      blocked: u.blocked ?? 0,
      showInContacts: u.show_in_contacts ?? false,
      lastSeenAt: u.last_seen_at ?? null,
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

export type UserAssignment =
  | { kind: 'group'; groupId: string }
  | { kind: 'miniteam'; dioceseId: string }
  | { kind: 'malteser'; dioceseId: string }

export const updateUserAssignment = (uid: string, assignment: UserAssignment) =>
  apiClient.put(`/v1/users/${uid}/assignment`, assignment.kind === 'group'
    ? { assignment: 'group', group_id: assignment.groupId }
    : { assignment: assignment.kind, diocese_id: assignment.dioceseId }
  ).then(r => r.data)

export const updateUserName = (uid: string, name: string) =>
  apiClient.put(`/v1/users/${uid}/name`, { name }).then(r => r.data)

export const createUser = (name: string, email: string, role: string, matrixUsername?: string) =>
  apiClient.post<CreateUserResult>('/v1/users', {
    name,
    email,
    role,
    ...(matrixUsername ? { matrix_username: matrixUsername } : {}),
  }).then(r => r.data)

export const createPersonWithoutAccount = (name: string, dioceseId: string, phone?: string) =>
  apiClient.post<ApiUser>('/v1/users/manual', {
    name,
    diocese_id: dioceseId,
    ...(phone ? { phone } : {}),
  }).then(r => ({
    uid: r.data.uid,
    name: r.data.name,
    role: r.data.role,
    groupId: r.data.group_id,
    phone: r.data.phone,
    dioceseId: r.data.diocese_id,
    matrixUserId: r.data.matrix_user_id ?? null,
    matrixUsername: r.data.matrix_username ?? null,
    hasAccount: false,
    fcmToken: null,
    mustChangePassword: 0,
    blocked: 0,
    showInContacts: false,
    createdAt: '',
    updatedAt: '',
  } as AppUser))

export const deleteUser = (uid: string): Promise<void> =>
  apiClient.delete(`/v1/users/${uid}`).then(() => undefined)

export const setUserBlocked = (uid: string, blocked: boolean) =>
  apiClient.put(`/v1/users/${uid}/blocked`, { blocked }).then(r => r.data)

export const setUserContactVisibility = (uid: string, visible: boolean) =>
  apiClient.put(`/v1/users/${uid}/contact-visibility`, { visible }).then(r => r.data)

export const resetUserPassword = (uid: string) =>
  apiClient.post(`/v1/users/${uid}/reset-password`).then(r => r.data)
