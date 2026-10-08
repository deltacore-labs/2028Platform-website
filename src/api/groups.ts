import { apiClient } from '../lib/api'
import type { Group, GroupMember } from '../types'

export const fetchGroups = () =>
  apiClient.get<Group[]>('/v1/groups').then(r => r.data)

export const fetchGroupMembers = (groupId: string) =>
  apiClient.get<GroupMember[]>(`/v1/groups/${groupId}/members`).then(r => r.data)

export const createGroup = (name: string) =>
  apiClient.post<{ id: string; name: string }>('/v1/groups', { name }).then(r => r.data)

export const updateGroup = (id: string, name: string) =>
  apiClient.put<{ id: string; name: string }>(`/v1/groups/${id}`, { name }).then(r => r.data)

export const deleteGroup = (id: string) =>
  apiClient.delete(`/v1/groups/${id}`).then(r => r.data)
