import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAllUsers, updateUserRole, updateUserGroup, updateUserDiocese, updateUserName, createUser, deleteUser, setUserBlocked, setUserContactVisibility, resetUserPassword } from '../api/users'
import { fetchGroups } from '../api/groups'
import { fetchDioceses } from '../api/dioceses'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../types'

const roleLabel: Record<UserRole, string> = {
  participant: 'Teilnehmer',
  leader: 'Leiter',
  miniteam: 'Miniteam',
  malteser: 'Malteser',
  admin: 'Admin',
}

const roleBadge: Record<UserRole, string> = {
  participant: 'bg-surface-strong text-ink-warm',
  leader: 'bg-[#f0faf4] text-[#16a34a]',
  miniteam: 'bg-[#f5f0fa] text-[#7c3aed]',
  malteser: 'bg-red-50 text-red-700',
  admin: 'bg-canvas-deep text-white',
}

const NO_DIOCESE = '__none__'

function suggestMatrixUsername(email: string, name: string): string {
  const source = email.split('@')[0] || name
  return source
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9._=-]+/g, '-')
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '')
    .slice(0, 64)
}

export function UsersPage() {
  const queryClient = useQueryClient()
  const { appUser } = useAuth()
  const isAdmin = appUser?.role === 'admin'

  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<UserRole>('leader')
  const [matrixUsername, setMatrixUsername] = useState('')
  const [matrixUsernameTouched, setMatrixUsernameTouched] = useState(false)
  const [createResult, setCreateResult] = useState<{
    name: string
    email: string
    tempPassword: string
    matrix: null | { created: boolean; userId?: string; username: string; tempPassword?: string; error?: string | null }
  } | null>(null)

  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<UserRole | ''>('')
  const [filterDiocese, setFilterDiocese] = useState('')
  const [filterGroup, setFilterGroup] = useState('')

  const [editingNameUid, setEditingNameUid] = useState<string | null>(null)
  const [editingNameValue, setEditingNameValue] = useState('')

  const [editingRoleUid, setEditingRoleUid] = useState<string | null>(null)
  const [editingGroupUid, setEditingGroupUid] = useState<string | null>(null)
  const [editingDioceseUid, setEditingDioceseUid] = useState<string | null>(null)

  const [confirmDeleteUid, setConfirmDeleteUid] = useState<string | null>(null)
  const [resetSuccessUid, setResetSuccessUid] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: fetchAllUsers,
  })

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: fetchGroups,
  })

  const { data: dioceses = [] } = useQuery({
    queryKey: ['dioceses'],
    queryFn: fetchDioceses,
    enabled: isAdmin,
  })

  const nameMutation = useMutation({
    mutationFn: ({ uid, name }: { uid: string; name: string }) => updateUserName(uid, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setEditingNameUid(null)
    },
  })

  const roleMutation = useMutation({
    mutationFn: ({ uid, role }: { uid: string; role: UserRole }) => updateUserRole(uid, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const groupMutation = useMutation({
    mutationFn: ({ uid, groupId }: { uid: string; groupId: string | null }) =>
      updateUserGroup(uid, groupId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const dioceseMutation = useMutation({
    mutationFn: ({ uid, dioceseId }: { uid: string; dioceseId: string | null }) =>
      updateUserDiocese(uid, dioceseId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const createMutation = useMutation({
    mutationFn: ({ name, email, role, matrixUsername }: { name: string; email: string; role: UserRole; matrixUsername?: string }) =>
      createUser(name, email, role, matrixUsername),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setCreateResult({
        name: newName,
        email: newEmail,
        tempPassword: data.temp_password,
        matrix: data.matrix ? {
          created: data.matrix.created,
          userId: data.matrix.user_id,
          username: data.matrix.username,
          tempPassword: data.matrix.temp_password,
          error: data.matrix.error,
        } : null,
      })
      setNewName('')
      setNewEmail('')
      setNewRole('leader')
      setMatrixUsername('')
      setMatrixUsernameTouched(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (uid: string) => deleteUser(uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setConfirmDeleteUid(null)
    },
    onError: (err: Error) => setActionError(err.message),
  })

  const blockMutation = useMutation({
    mutationFn: ({ uid, blocked }: { uid: string; blocked: boolean }) => setUserBlocked(uid, blocked),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    onError: (err: Error) => setActionError(err.message),
  })

  const contactVisibilityMutation = useMutation({
    mutationFn: ({ uid, visible }: { uid: string; visible: boolean }) =>
      setUserContactVisibility(uid, visible),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    onError: (err: Error) => setActionError(err.message),
  })

  const resetPasswordMutation = useMutation({
    mutationFn: (uid: string) => resetUserPassword(uid),
    onSuccess: (_data, uid) => {
      setResetSuccessUid(uid)
      setTimeout(() => setResetSuccessUid(null), 3000)
    },
    onError: (err: Error) => setActionError(err.message),
  })

  const groupName = (id: string | null) => groups.find(g => g.id === id)?.name ?? '—'
  const dioceseName = (id: string | null) => {
    if (!id) return '—'
    return dioceses.find(d => d.id === id)?.name ?? id
  }

  const filtered = users.filter(u => {
    if (search && !u.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filterRole && u.role !== filterRole) return false
    if (filterDiocese === NO_DIOCESE && u.dioceseId !== null) return false
    if (filterDiocese && filterDiocese !== NO_DIOCESE && u.dioceseId !== filterDiocese) return false
    if (filterGroup && u.groupId !== filterGroup) return false
    return true
  })

  const hasActiveFilter = search || filterRole || filterDiocese || filterGroup

  function startEditName(uid: string, currentName: string) {
    setEditingNameUid(uid)
    setEditingNameValue(currentName)
  }

  function commitNameEdit(uid: string) {
    const trimmed = editingNameValue.trim()
    if (trimmed.length >= 2) {
      nameMutation.mutate({ uid, name: trimmed })
    }
  }

  const inputClass = "bg-surface text-ink rounded-lg px-3 py-2.5 border border-hairline-strong text-[14px] focus:outline-none focus:border-ink transition-colors placeholder:text-muted-soft"

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="font-display text-[32px] text-ink" style={{ fontWeight: 300, letterSpacing: '-0.32px' }}>
          Nutzerverwaltung
        </h2>
        <p className="text-muted text-[13px] mt-0.5 tracking-[0.16px]">
          {hasActiveFilter ? `${filtered.length} von ${users.length} Nutzern` : `${users.length} Nutzer`}
        </p>
      </div>

      {/* Create user card */}
      <div className="bg-surface border border-hairline rounded-xl p-6 mb-6 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
        <p className="text-[11px] font-semibold tracking-[0.8px] uppercase text-muted mb-1">
          Neues Konto
        </p>
        <p className="text-muted text-[13px] mb-4">
          Das Konto erhält ein temporäres Passwort, das beim ersten Login geändert werden muss.
        </p>

        {createResult && (
          <div className={`border rounded-xl p-4 mb-4 ${createResult.matrix && !createResult.matrix.created ? 'bg-amber-50 border-amber-200' : 'bg-[#f0faf4] border-[#bbf7d0]'}`}>
            <p className={`font-medium text-[14px] mb-1 ${createResult.matrix && !createResult.matrix.created ? 'text-amber-800' : 'text-[#16a34a]'}`}>
              Konto für {createResult.name} erstellt
            </p>
            <p className="text-body text-[13px]">
              App-Login: <span className="font-medium">{createResult.email}</span><br />
              App-Passwort:{' '}
              <span className="font-mono font-bold">{createResult.tempPassword}</span>
            </p>
            {createResult.matrix?.created && (
              <p className="text-body text-[13px] mt-3 pt-3 border-t border-green-200">
                Matrix-ID: <span className="font-mono font-medium">{createResult.matrix.userId}</span><br />
                Matrix-Login: <span className="font-mono font-medium">{createResult.matrix.username}</span><br />
                Matrix-Passwort: <span className="font-mono font-bold">{createResult.matrix.tempPassword}</span>
              </p>
            )}
            {createResult.matrix && !createResult.matrix.created && (
              <p className="text-amber-800 text-[13px] mt-3 pt-3 border-t border-amber-200">
                Das App-Konto wurde erstellt, das Matrix-Konto „{createResult.matrix.username}“ jedoch nicht: {createResult.matrix.error ?? 'Unbekannter Fehler'}
              </p>
            )}
            <button
              onClick={() => setCreateResult(null)}
              className="mt-2 text-[13px] text-[#16a34a] hover:underline underline-offset-2"
            >
              Schließen
            </button>
          </div>
        )}

        {createMutation.error && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-4 text-[#dc2626] text-[13px] font-mono">
            {(createMutation.error as Error).message}
          </div>
        )}

        <div className="flex gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[12px] font-medium text-muted mb-1.5 tracking-[0.4px] uppercase">Name</label>
            <input
              type="text"
              placeholder="Vor- und Nachname"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className={`w-full ${inputClass}`}
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[12px] font-medium text-muted mb-1.5 tracking-[0.4px] uppercase">E-Mail</label>
            <input
              type="email"
              placeholder="name@bistum.de"
              value={newEmail}
              onChange={e => {
                setNewEmail(e.target.value)
                if (!matrixUsernameTouched) setMatrixUsername(suggestMatrixUsername(e.target.value, newName))
              }}
              className={`w-full ${inputClass}`}
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-muted mb-1.5 tracking-[0.4px] uppercase">Rolle</label>
            <select
              value={newRole}
              onChange={e => {
                const role = e.target.value as UserRole
                setNewRole(role)
                if (role === 'miniteam' && !matrixUsernameTouched) {
                  setMatrixUsername(suggestMatrixUsername(newEmail, newName))
                }
              }}
              className={`bg-surface ${inputClass}`}
            >
              <option value="leader">Leiter</option>
              <option value="participant">Teilnehmer</option>
              <option value="miniteam">Miniteam</option>
              <option value="malteser">Malteser</option>
              {isAdmin && <option value="admin">Admin</option>}
            </select>
          </div>
          {newRole === 'miniteam' && (
            <div className="w-full basis-full rounded-xl border border-[#d8d2c8] bg-canvas-soft p-4">
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="flex-1">
                  <label className="block text-[12px] font-medium text-muted mb-1.5 tracking-[0.4px] uppercase">
                    Matrix-Nutzername
                  </label>
                  <div className="flex items-center">
                    <span className="px-3 py-2.5 border border-r-0 border-hairline-strong rounded-l-lg bg-canvas text-muted text-[14px]">@</span>
                    <input
                      type="text"
                      value={matrixUsername}
                      onChange={e => { setMatrixUsername(e.target.value.toLowerCase()); setMatrixUsernameTouched(true) }}
                      className={`w-full rounded-l-none ${inputClass}`}
                      placeholder="vorname.nachname"
                      pattern="[a-z0-9._=-]{3,64}"
                    />
                    <span className="hidden sm:block px-3 py-2.5 border border-l-0 border-hairline-strong rounded-r-lg bg-canvas text-muted text-[14px]">:matrix.deltacorelabs.de</span>
                  </div>
                </div>
                <p className="text-[12px] leading-5 text-muted sm:max-w-[230px]">
                  Das Matrix-Konto wird automatisch mit derselben E-Mail und einem eigenen temporären Passwort angelegt.
                </p>
              </div>
            </div>
          )}
          <button
            onClick={() => createMutation.mutate({
              name: newName.trim(),
              email: newEmail.trim(),
              role: newRole,
              matrixUsername: newRole === 'miniteam' ? matrixUsername : undefined,
            })}
            disabled={newName.trim().length < 2 || !newEmail.includes('@') || (newRole === 'miniteam' && !/^[a-z0-9._=-]{3,64}$/.test(matrixUsername)) || createMutation.isPending}
            className="bg-ink-warm hover:bg-ink disabled:opacity-40 text-white text-[15px] font-medium px-5 py-2.5 rounded-pill transition-colors"
          >
            {createMutation.isPending ? 'Anlegen…' : 'Anlegen'}
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex gap-3 flex-wrap mb-4">
        <input
          type="text"
          placeholder="Name suchen…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={`flex-1 min-w-[160px] ${inputClass}`}
        />
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value as UserRole | '')}
          className={`bg-surface ${inputClass}`}
        >
          <option value="">Alle Rollen</option>
          <option value="participant">Teilnehmer</option>
          <option value="leader">Leiter</option>
          <option value="miniteam">Miniteam</option>
          <option value="malteser">Malteser</option>
          <option value="admin">Admin</option>
        </select>
        {isAdmin && (
          <select
            value={filterDiocese}
            onChange={e => setFilterDiocese(e.target.value)}
            className={`bg-surface ${inputClass}`}
          >
            <option value="">Alle Bistümer</option>
            <option value={NO_DIOCESE}>Kein Bistum</option>
            {dioceses.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        )}
        <select
          value={filterGroup}
          onChange={e => setFilterGroup(e.target.value)}
          className={`bg-surface ${inputClass}`}
        >
          <option value="">Alle Gruppen</option>
          {groups.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        {hasActiveFilter && (
          <button
            onClick={() => { setSearch(''); setFilterRole(''); setFilterDiocese(''); setFilterGroup('') }}
            className="text-[13px] text-muted hover:text-ink transition-colors px-3 py-2.5 rounded-lg border border-hairline-strong hover:bg-canvas"
          >
            Zurücksetzen
          </button>
        )}
      </div>

      {isLoading && <p className="text-muted text-[15px]">Lade…</p>}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4 text-[#dc2626] text-[13px] font-mono">
          Fehler: {(error as Error).message}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-hairline">
        <div className="bg-surface min-w-[760px]">
          <table className="w-full text-[14px]">
          <thead>
            <tr className="border-b border-hairline">
              <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-[0.8px] uppercase text-muted">Name</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-[0.8px] uppercase text-muted">Rolle</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-[0.8px] uppercase text-muted">Gruppe</th>
              {isAdmin && (
                <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-[0.8px] uppercase text-muted">Bistum</th>
              )}
              <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-[0.8px] uppercase text-muted">Kontakte</th>
              <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-[0.8px] uppercase text-muted">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {filtered.map(u => (
              <tr key={u.uid} className="hover:bg-canvas-soft transition-colors">
                {/* Name cell — inline editing */}
                <td className="px-5 py-3.5">
                  {editingNameUid === u.uid ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={editingNameValue}
                        onChange={e => setEditingNameValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') commitNameEdit(u.uid)
                          if (e.key === 'Escape') setEditingNameUid(null)
                        }}
                        className="bg-canvas text-ink rounded-lg px-2.5 py-1.5 border border-hairline-strong text-[14px] focus:outline-none focus:border-ink transition-colors w-40"
                      />
                      <button
                        onClick={() => commitNameEdit(u.uid)}
                        disabled={editingNameValue.trim().length < 2 || nameMutation.isPending}
                        className="text-[12px] bg-ink-warm hover:bg-ink disabled:opacity-40 text-white px-2.5 py-1 rounded-pill transition-colors font-medium"
                      >
                        {nameMutation.isPending ? '…' : 'OK'}
                      </button>
                      <button
                        onClick={() => setEditingNameUid(null)}
                        className="text-[12px] text-muted hover:text-ink transition-colors px-1.5 py-1"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <div>
                        <p className="text-ink font-medium">{u.name}</p>
                        {u.phone && <p className="text-muted text-[12px] mt-0.5">{u.phone}</p>}
                        {u.blocked === 1 && (
                          <span className="inline-block text-[10px] font-semibold tracking-[0.6px] uppercase bg-red-50 text-red-600 border border-red-100 rounded-pill px-2 py-0.5 mt-1">
                            Gesperrt
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => startEditName(u.uid, u.name)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-muted hover:text-ink px-1.5 py-0.5 rounded hover:bg-canvas"
                        title="Name bearbeiten"
                      >
                        ✎
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  {editingRoleUid === u.uid ? (
                    <div className="flex items-center gap-2">
                      <select
                        autoFocus
                        value={u.role}
                        onChange={e => {
                          roleMutation.mutate({ uid: u.uid, role: e.target.value as UserRole })
                          setEditingRoleUid(null)
                        }}
                        onBlur={() => setEditingRoleUid(null)}
                        className="bg-canvas text-ink rounded-lg px-2.5 py-1.5 border border-hairline-strong text-[13px] focus:outline-none focus:border-ink transition-colors"
                      >
                        <option value="participant">Teilnehmer</option>
                        <option value="leader">Leiter</option>
                        <option value="miniteam">Miniteam</option>
                        <option value="malteser">Malteser</option>
                        {isAdmin && <option value="admin">Admin</option>}
                      </select>
                      <button
                        onClick={() => setEditingRoleUid(null)}
                        className="text-[12px] text-muted hover:text-ink transition-colors px-1.5 py-1"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <span className={`px-2.5 py-0.5 rounded-pill text-[11px] font-semibold tracking-[0.6px] uppercase ${roleBadge[u.role]}`}>
                        {roleLabel[u.role]}
                      </span>
                      <button
                        onClick={() => setEditingRoleUid(u.uid)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-muted hover:text-ink px-1.5 py-0.5 rounded hover:bg-canvas"
                        title="Rolle bearbeiten"
                      >
                        ✎
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  {u.role === 'admin' ? (
                    <span className="text-muted-soft italic text-[13px]">global</span>
                  ) : editingGroupUid === u.uid ? (
                    <div className="flex items-center gap-2">
                      <select
                        autoFocus
                        value={u.groupId ?? ''}
                        onChange={e => {
                          groupMutation.mutate({ uid: u.uid, groupId: e.target.value || null })
                          setEditingGroupUid(null)
                        }}
                        onBlur={() => setEditingGroupUid(null)}
                        className="bg-canvas text-ink rounded-lg px-2.5 py-1.5 border border-hairline-strong text-[13px] focus:outline-none focus:border-ink transition-colors"
                      >
                        <option value="">Keine Gruppe</option>
                        {groups.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => setEditingGroupUid(null)}
                        className="text-[12px] text-muted hover:text-ink transition-colors px-1.5 py-1"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <span className="text-body">
                        {u.groupId
                          ? groupName(u.groupId)
                          : <span className="text-muted-soft italic text-[13px]">keine</span>
                        }
                      </span>
                      <button
                        onClick={() => setEditingGroupUid(u.uid)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-muted hover:text-ink px-1.5 py-0.5 rounded hover:bg-canvas"
                        title="Gruppe bearbeiten"
                      >
                        ✎
                      </button>
                    </div>
                  )}
                </td>
                {isAdmin && (
                  <td className="px-5 py-3.5">
                    {u.role === 'admin' ? (
                      <span className="text-muted-soft italic text-[13px]">alle Bistümer</span>
                    ) : editingDioceseUid === u.uid ? (
                      <div className="flex items-center gap-2">
                        <select
                          autoFocus
                          value={u.dioceseId ?? ''}
                          onChange={e => {
                            dioceseMutation.mutate({ uid: u.uid, dioceseId: e.target.value || null })
                            setEditingDioceseUid(null)
                          }}
                          onBlur={() => setEditingDioceseUid(null)}
                          className="bg-canvas text-ink rounded-lg px-2.5 py-1.5 border border-hairline-strong text-[13px] focus:outline-none focus:border-ink transition-colors"
                        >
                          <option value="">Kein Bistum</option>
                          {dioceses.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => setEditingDioceseUid(null)}
                          className="text-[12px] text-muted hover:text-ink transition-colors px-1.5 py-1"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <span>
                          {u.dioceseId
                            ? dioceseName(u.dioceseId)
                            : <span className="text-muted-soft italic text-[13px]">kein Bistum</span>
                          }
                        </span>
                        <button
                          onClick={() => setEditingDioceseUid(u.uid)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-muted hover:text-ink px-1.5 py-0.5 rounded hover:bg-canvas"
                          title="Bistum bearbeiten"
                        >
                          ✎
                        </button>
                      </div>
                    )}
                  </td>
                )}
                <td className="px-5 py-3.5">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={u.showInContacts}
                    aria-label={`${u.name} in der Kontaktliste anzeigen`}
                    title={u.phone ? (u.showInContacts ? 'Aus Kontaktliste entfernen' : 'In Kontaktliste anzeigen') : 'Zuerst Telefonnummer im App-Profil hinterlegen'}
                    disabled={!u.phone || contactVisibilityMutation.isPending}
                    onClick={() => contactVisibilityMutation.mutate({ uid: u.uid, visible: !u.showInContacts })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${u.showInContacts ? 'bg-[#16a34a]' : 'bg-hairline-strong'}`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${u.showInContacts ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex gap-1.5">
                    {/* Reset password */}
                    {resetSuccessUid === u.uid ? (
                      <span className="text-[12px] text-[#16a34a] px-2 py-1">✓ E-Mail gesendet</span>
                    ) : (
                      <button
                        onClick={() => resetPasswordMutation.mutate(u.uid)}
                        disabled={resetPasswordMutation.isPending || appUser?.uid === u.uid}
                        className="text-[12px] text-muted hover:text-ink disabled:opacity-40 px-2 py-1 rounded hover:bg-canvas transition-colors border border-transparent hover:border-hairline-strong"
                        title="Passwort-Reset-E-Mail senden"
                      >
                        🔑
                      </button>
                    )}

                    {/* Block / Unblock */}
                    <button
                      onClick={() => blockMutation.mutate({ uid: u.uid, blocked: u.blocked !== 1 })}
                      disabled={blockMutation.isPending || appUser?.uid === u.uid}
                      className="text-[12px] text-muted hover:text-ink disabled:opacity-40 px-2 py-1 rounded hover:bg-canvas transition-colors border border-transparent hover:border-hairline-strong"
                      title={u.blocked === 1 ? 'Entsperren' : 'Sperren'}
                    >
                      {u.blocked === 1 ? '🔓' : '🔒'}
                    </button>

                    {/* Delete */}
                    {confirmDeleteUid === u.uid ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] text-muted">Wirklich?</span>
                        <button
                          onClick={() => deleteMutation.mutate(u.uid)}
                          disabled={deleteMutation.isPending}
                          className="text-[12px] bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white px-2 py-1 rounded-pill transition-colors font-medium"
                        >
                          {deleteMutation.isPending ? '…' : 'Löschen'}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteUid(null)}
                          className="text-[12px] text-muted hover:text-ink px-1.5 py-1 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteUid(u.uid)}
                        disabled={appUser?.uid === u.uid}
                        className="text-[12px] text-muted hover:text-red-600 disabled:opacity-40 px-2 py-1 rounded hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
                        title="Nutzer löschen"
                      >
                        🗑
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !isLoading && (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="px-5 py-6 text-muted text-[14px] text-center">
                  Keine Nutzer gefunden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mt-4 flex items-center justify-between">
          <p className="text-[#dc2626] text-[13px] font-mono">{actionError}</p>
          <button
            onClick={() => setActionError(null)}
            className="text-[#dc2626] text-[13px] hover:opacity-70 transition-opacity ml-4"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
