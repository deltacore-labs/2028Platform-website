import { apiClient } from '../lib/api'
import type { Group, GroupMember, JoinRequest } from '../types'

export const fetchGroups = () =>
  apiClient.get<Group[]>('/v1/groups').then(r => r.data)

export const createGroup = (name: string) =>
  apiClient.post<{ id: string; name: string }>('/v1/groups', { name }).then(r => r.data)

export const updateGroup = (groupId: string, name: string) =>
  apiClient.put<{ id: string; name: string }>(`/v1/groups/${groupId}`, { name }).then(r => r.data)

export const deleteGroup = (groupId: string) =>
  apiClient.delete(`/v1/groups/${groupId}`).then(r => r.data)

export const fetchGroupMembers = (groupId: string) =>
  apiClient.get<GroupMember[]>(`/v1/groups/${groupId}/members`).then(r => r.data)

export const fetchJoinRequests = (groupId: string) =>
  apiClient.get<JoinRequest[]>(`/v1/groups/${groupId}/join-requests`).then(r => r.data)

export const resolveJoinRequest = (
  groupId: string,
  requestId: string,
  action: 'approve' | 'reject',
) =>
  apiClient
    .put(`/v1/groups/${groupId}/join-requests/${requestId}`, { action })
    .then(r => r.data)
