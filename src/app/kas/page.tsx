'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Profile = { id: string; username: string | null; full_name: string | null; email?: string | null }
type ActionRow = { entry_id: string; table_name: 'raket_logs'|'strepen_logs'|'frisdrank_logs'; kind: string; amount: number; ts: string }

export default function KasDashboard() {
  const [users, setUsers] = useState<Profile[]>([])
  const [kasIds, setKasIds] = useState<Set<string>>(new Set())
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [recent, setRecent] = useState<ActionRow[]>([])
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  // load users
  useEffect(() => {
    void (async () => {
      // profiles (public readable per your policy)
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, username, full_name')
      if (pErr) return

      // emails (optional): join via auth if you’ve mirrored emails somewhere;
      // or skip email entirely on the KAS screen.
      const list: Profile[] = (profiles ?? []).map(p => ({
        id: p.id,
        username: p.username,
        full_name: p.full_name,
      }))
      setUsers(list)

      // current KAS set
      const { data: roles, error: rErr } = await supabase
        .from('user_roles')
        .select('user_id, role')
      if (rErr) return
      setKasIds(new Set((roles ?? []).filter(r => r.role === 'kas').map(r => r.user_id)))
    })()
  }, [])

  const displayName = (u: Profile) => (u.username && u.username.trim() !== '' ? u.username : u.full_name) ?? u.id.slice(0,8)

  // toggle kas
  const toggleKas = async (userId: string, makeKas: boolean) => {
    setLoading(true)
    try {
      if (makeKas) {
        const { error } = await supabase.rpc('kas_grant', { target: userId })
        if (error) throw error
        setKasIds(prev => new Set(prev).add(userId))
      } else {
        const { error } = await supabase.rpc('kas_revoke', { target: userId })
        if (error) throw error
        setKasIds(prev => {
          const next = new Set(prev)
          next.delete(userId)
          return next
        })
      }
    } catch (e) {
      console.error(e)
      alert('Kon rol niet aanpassen.')
    } finally {
      setLoading(false)
    }
  }

  // fetch recent actions
  const loadRecent = async (userId: string) => {
    setSelectedUser(userId)
    setSelectedActions(new Set())
    const { data, error } = await supabase.rpc('recent_actions_for_user', { target: userId, n: 5 })
    if (error) {
      console.error(error)
      return
    }
    setRecent(data ?? [])
  }

  // undo selected actions
  const undoSelected = async () => {
    if (!selectedActions.size) return
    setLoading(true)
    try {
      const rows = recent.filter(r => selectedActions.has(r.entry_id))
      for (const r of rows) {
        const { error } = await supabase.rpc('undo_action', {
          action_table: r.table_name,
          action_id: r.entry_id
        })
        if (error) throw error
      }
      // refresh recent
      if (selectedUser) await loadRecent(selectedUser)
    } catch (e) {
      console.error(e)
      alert('Ongedaan maken mislukt.')
    } finally {
      setLoading(false)
    }
  }

  const resetAll = async () => {
    if (!confirm('Alles resetten (raket, strepen, frisdrank)?')) return
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('reset_all_logs')
      if (error) throw error
      alert(`Reset OK: ${JSON.stringify(data)}`)
      if (selectedUser) await loadRecent(selectedUser)
    } catch (e) {
      console.error(e)
      alert('Reset mislukt.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">KAS</h1>
        <button
          onClick={resetAll}
          className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={loading}
        >
          Database resetten
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Users */}
        <section className="border rounded-lg p-4">
          <h2 className="font-semibold mb-3">Gebruikers</h2>
          <ul className="space-y-2 max-h-[420px] overflow-auto">
            {users.map(u => (
              <li key={u.id} className="flex items-center justify-between gap-2">
                <button
                  className="text-left flex-1 hover:underline"
                  onClick={() => loadRecent(u.id)}
                >
                  {displayName(u)}
                </button>
                <button
                  onClick={() => toggleKas(u.id, !kasIds.has(u.id))}
                  className={`px-3 py-1 rounded text-sm ${kasIds.has(u.id) ? 'bg-yellow-500 text-black' : 'bg-gray-200 text-gray-900'}`}
                  disabled={loading}
                  title={kasIds.has(u.id) ? 'Kas intrekken' : 'Kas toekennen'}
                >
                  {kasIds.has(u.id) ? 'KAS' : 'Maak KAS'}
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Recent actions */}
        <section className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Laatste acties {selectedUser ? '' : '(selecteer gebruiker)'}</h2>
            <button
              onClick={undoSelected}
              className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
              disabled={!selectedActions.size || loading}
            >
              Geselecteerde ongedaan maken
            </button>
          </div>
          <ul className="space-y-2">
            {recent.map(r => (
              <li key={r.entry_id} className="flex items-center gap-3 border rounded p-2">
                <input
                  type="checkbox"
                  checked={selectedActions.has(r.entry_id)}
                  onChange={e => {
                    const next = new Set(selectedActions)
                    if (e.target.checked) {
                      next.add(r.entry_id)
                    } else {
                      next.delete(r.entry_id)
                    }
                    setSelectedActions(next)
                  }}
                />
                <div className="flex-1">
                  <div className="font-medium">{r.kind} · {r.amount}</div>
                  <div className="text-xs text-gray-500">{new Date(r.ts).toLocaleString()}</div>
                </div>
                <span className="text-xs rounded bg-gray-100 px-2 py-0.5">{r.table_name.replace('_logs','')}</span>
              </li>
            ))}
            {!recent.length && <li className="text-sm text-gray-500">Geen recente acties.</li>}
          </ul>
        </section>
      </div>

      {/* Rekening all-time */}
      <AllTimeTable />
    </main>
  )
}

function AllTimeTable() {
  const [rows, setRows] = useState<{profile_id:string; display_name:string|null; raket_total:number; fris_total:number; streep_total:number}[]>([])
  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase.rpc('rekening_alltime')
      if (!error) setRows(data ?? [])
    })()
  }, [])
  return (
    <section className="border rounded-lg p-4">
      <h2 className="font-semibold mb-3">Rekening (all-time)</h2>
      <div className="overflow-auto">
        <table className="min-w-[640px] w-full text-sm">
          <thead className="text-left border-b">
            <tr>
              <th className="py-2 pr-3">Naam</th>
              <th className="py-2 pr-3">Raketten</th>
              <th className="py-2 pr-3">ND’s</th>
              <th className="py-2">Strepen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.profile_id} className="border-b last:border-0">
                <td className="py-2 pr-3">{r.display_name ?? r.profile_id.slice(0,8)}</td>
                <td className="py-2 pr-3">{r.raket_total}</td>
                <td className="py-2 pr-3">{r.fris_total}</td>
                <td className="py-2">{r.streep_total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}