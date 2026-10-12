export type UserRole = 'participant' | 'leader' | 'miniteam' | 'admin'
export type AnnouncementPriority = 'info' | 'important' | 'critical'
export type LocationType = 'venue' | 'water' | 'medical' | 'shade' | 'transport' | 'spiritual'
export type EmergencyType = 'emergency' | 'lost' | 'unwell'
export type EmergencySubtype = 'heat' | 'injury' | 'nausea'
export type EmergencyStatus = 'open' | 'in_progress' | 'resolved'

export interface AppUser {
  uid: string
  name: string
  role: UserRole
  groupId: string | null
  phone: string | null
  dioceseId: string | null
  fcmToken: string | null
  mustChangePassword: number
  createdAt: string
  updatedAt: string
}

export interface Group {
  id: string
  name: string
  leaderId: string | null
  leaderName: string | null
  leaderPhone: string | null
}

export interface GroupMember {
  uid: string
  name: string
  phone: string | null
}

export interface Announcement {
  id: string
  text: string
  priority: AnnouncementPriority
  targetGroupIds: string[]
  targetRoles: UserRole[]
  createdBy: string
  createdAt: string
  isRead: boolean
}

export interface EmergencyReport {
  id: string
  type: EmergencyType
  subtype: EmergencySubtype | null
  reporterUid: string
  reporterName: string
  reporterPhone: string | null
  groupId: string | null
  lat: number | null
  lng: number | null
  status: EmergencyStatus
  createdAt: string
  assignedTo: string | null
}

export interface AppEvent {
  id: string
  title: string
  description: string
  startDate: number
  endDate: number
  locationId: string | null
  targetRoles: string  // JSON string from DB — parse before use
  groupId: string | null
  createdBy: string
  createdAt: number
}

export interface JoinRequest {
  id: string
  requester_uid: string
  requester_name: string
  created_at: number
}

export interface Diocese {
  id: string
  name: string
}
