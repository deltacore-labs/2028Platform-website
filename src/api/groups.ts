import { apiClient } from '../lib/api'
import type { Group, GroupMember } from '../types'

export const fetchGroups = () =>
  apiClient.get<Group[]>('/v1/groups').then(r => r.data)

export const fetchGroupMembers = (groupId: string) =>
  apiClient.get<GroupMember[]>(`/v1/groups/${groupId}/members`).then(r => r.data)
