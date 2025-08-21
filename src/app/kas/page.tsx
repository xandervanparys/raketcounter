"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { HomeIcon as House, ChevronDown, ChevronUp, Users, Activity, Download, RotateCcw } from "lucide-react"
import RekeningOverview, { exportRekeningXlsx } from "@/components/RekeningOverview"
import type { RekeningRow, Profile, ActionRow } from "@/types"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

function useRekeningAllTime() {
  const [rows, setRows] = useState<RekeningRow[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = async () => {
    setLoading(true)
    const { data, error } = await supabase.rpc("rekening_alltime")
    if (!error && data) {
      setRows(data as RekeningRow[])
    }
    setLoading(false)
  }

  useEffect(() => {
    void refetch()
  }, [])

  return { rows, loading, refetch }
}

export default function KasDashboard() {
  const router = useRouter()
  const [kasChecked, setKasChecked] = useState(false)
  const [isKas, setIsKas] = useState(false)
  const [users, setUsers] = useState<Profile[]>([])
  const [kasIds, setKasIds] = useState<Set<string>>(new Set())
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [recent, setRecent] = useState<ActionRow[]>([])
  const [recentCursor, setRecentCursor] = useState<{
    ts: string
    id: string
  } | null>(null)
  const [recentHasMore, setRecentHasMore] = useState(false)
  const PAGE_SIZE = 5
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const [openQuickFor, setOpenQuickFor] = useState<string | null>(null)

  const [qtyByUser, setQtyByUser] = useState<Record<string, { raket: number; fris: number; streep: number }>>({})

  const getQty = (userId: string) => {
    return qtyByUser[userId] || { raket: 1, fris: 1, streep: 1 }
  }

  const setQtyField = (userId: string, field: "raket" | "fris" | "streep", value: number) => {
    setQtyByUser((prev) => ({
      ...prev,
      [userId]: {
        ...getQty(userId),
        [field]: Math.max(1, Math.floor(value || 1)),
      },
    }))
  }

  const addLogFor = async (userId: string, kind: "raket" | "fris" | "streep", amount: number) => {
    if (loading) return
    setLoading(true)
    try {
      let table: "raket_logs" | "frisdrank_logs" | "strepen_logs"
      if (kind === "raket") table = "raket_logs"
      else if (kind === "fris") table = "frisdrank_logs"
      else table = "strepen_logs"

      const { error } = await supabase.from(table).insert({
        profile_id: userId,
        amount,
      })
      if (error) throw error
      // no-op; `.throwOnError()` is not used here because we want the typed `error`
      setOpenQuickFor(null)
      if (selectedUser === userId) {
        await loadRecent(userId)
      }
      await refetchRekening()
    } catch (e) {
      console.error(e)
      alert("Toevoegen mislukt.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void (async () => {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData?.user) {
        router.replace("/login")
        return
      }
      const { data: kasRes, error: kasErr } = await supabase.rpc("is_kas")
      if (kasErr || !kasRes) {
        router.replace("/404")
        return
      }
      setIsKas(true)
      setKasChecked(true)
    })()
  }, [router])

  useEffect(() => {
    if (!isKas) return
    void (async () => {
      const { data: profiles, error: pErr } = await supabase.from("profiles").select("id, username, full_name")
      if (pErr) return

      const list: Profile[] = (profiles ?? []).map((p) => ({
        id: p.id,
        username: p.username,
        full_name: p.full_name,
      }))
      setUsers(list)

      const { data: roles, error: rErr } = await supabase.from("user_roles").select("user_id, role")
      if (rErr) return
      setKasIds(new Set((roles ?? []).filter((r) => r.role === "kas").map((r) => r.user_id)))
    })()
  }, [isKas])

  const { rows: rekeningRows, loading: rekeningLoading, refetch: refetchRekening } = useRekeningAllTime()

  const displayName = (u: Profile) =>
    (u.username && u.username.trim() !== "" ? u.username : u.full_name) ?? u.id.slice(0, 8)

  const toggleKas = async (userId: string, makeKas: boolean) => {
    setLoading(true)
    try {
      if (makeKas) {
        const { error } = await supabase.rpc("kas_grant", { target: userId })
        if (error) throw error
        setKasIds((prev) => new Set(prev).add(userId))
      } else {
        const { error } = await supabase.rpc("kas_revoke", { target: userId })
        if (error) throw error
        setKasIds((prev) => {
          const next = new Set(prev)
          next.delete(userId)
          return next
        })
      }
    } catch (e) {
      console.error(e)
      alert("Kon rol niet aanpassen.")
    } finally {
      setLoading(false)
    }
  }

  const loadRecent = async (userId: string) => {
    setSelectedUser(userId)
    setSelectedActions(new Set())
    try {
      const { data, error } = await supabase
        .rpc("recent_actions_for_user", { target: userId, n: PAGE_SIZE });
      if(error) throw(error);

      // If PostgREST returns an error, `.throwOnError()` will throw before this line.
      const rows = (data ?? []) as ActionRow[]
      setRecent(rows)

      if (rows.length > 0) {
        const last = rows[rows.length - 1]
        setRecentCursor({ ts: last.ts, id: last.entry_id })
        setRecentHasMore(rows.length === PAGE_SIZE)
      } else {
        setRecentCursor(null)
        setRecentHasMore(false)
      }
    } catch (e: unknown) {
      const err = e as { message?: string; details?: string; hint?: string }
      console.error("recent_actions_for_user failed:", err?.message, err?.details, err?.hint)
    }
  }

  // append next page
  const loadMoreRecent = async () => {
    if (!selectedUser || !recentCursor) return
    try {
      const { data } = await supabase
        .rpc("recent_actions_for_user", {
          target: selectedUser,
          n: PAGE_SIZE,
          cursor_ts: recentCursor.ts,
          cursor_id: recentCursor.id,
        })
        .throwOnError()

      const next = (data ?? []) as ActionRow[]
      setRecent((prev) => [...prev, ...next])

      if (next.length > 0) {
        const last = next[next.length - 1]
        setRecentCursor({ ts: last.ts, id: last.entry_id })
        setRecentHasMore(next.length === PAGE_SIZE)
      } else {
        setRecentHasMore(false)
      }
    } catch (e: unknown) {
      const err = e as { message?: string; details?: string; hint?: string }
      console.error("loadMore recent failed:", err?.message, err?.details, err?.hint)
    }
  }

  const undoSelected = async () => {
    if (!selectedActions.size) return
    setLoading(true)
    try {
      const rows = recent.filter((r) => selectedActions.has(r.entry_id))
      for (const r of rows) {
        const { error } = await supabase.rpc("undo_action", {
          action_table: r.table_name,
          action_id: r.entry_id,
        })
        if (error) throw error
      }
      if (selectedUser) await loadRecent(selectedUser)
      await refetchRekening()
    } catch (e) {
      console.error(e)
      alert("Ongedaan maken mislukt.")
    } finally {
      setLoading(false)
    }
  }

  const resetAll = () => {
    setShowResetConfirm(true)
  }

  if (!kasChecked) return null
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-6 space-y-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={() => router.push("/")}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-700 dark:text-slate-200 px-6 py-3 rounded-xl hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-600 dark:hover:to-slate-500 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                aria-label="Home"
                title="Home"
              >
                <House className="w-5 h-5" />
                <span className="font-medium">Home</span>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">K</span>
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  KAS Dashboard
                </h1>
              </div>
            </div>

            <button
              onClick={resetAll}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl font-medium text-sm"
              disabled={loading}
            >
              <RotateCcw className="w-4 h-4" />
              Database resetten
            </button>
          </div>
        </div>

        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowResetConfirm(false)} />
            <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RotateCcw className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Database resetten</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Je staat op het punt om <strong>alle logs</strong> (raket, strepen, frisdrank) te verwijderen. Wil je
                  eerst de huidige rekening als Excel downloaden?
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
                >
                  Annuleren
                </button>
                <button
                  onClick={async () => {
                    try {
                      setIsDownloading(true)
                      await exportRekeningXlsx(rekeningRows)
                    } finally {
                      setIsDownloading(false)
                    }
                  }}
                  disabled={isDownloading}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white disabled:opacity-50 transition-all font-medium"
                >
                  <Download className="w-4 h-4" />
                  {isDownloading ? "Downloaden..." : "Download Excel"}
                </button>
                <button
                  onClick={async () => {
                    setShowResetConfirm(false)
                    setLoading(true)
                    try {
                      const { data, error } = await supabase.rpc("reset_all_logs")
                      if (error) throw error
                      alert(`Reset OK: ${JSON.stringify(data)}`)
                      if (selectedUser) await loadRecent(selectedUser)
                      await refetchRekening()
                    } catch (e) {
                      console.error(e)
                      alert("Reset mislukt.")
                    } finally {
                      setLoading(false)
                    }
                  }}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-all font-medium"
                >
                  Reset zonder download
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Users Section */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 p-6 border-b border-slate-200 dark:border-slate-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Gebruikers</h2>
              </div>
            </div>
            <div className="p-6">
              <ul className="space-y-3 max-h-[420px] overflow-auto">
                {users.map((u) => (
                  <li
                    key={u.id}
                    className={`group rounded-xl p-4 border transition-all duration-200 ${
                      selectedUser === u.id
                        ? // Added clear visual indicator for selected user
                          "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 shadow-md"
                        : "hover:text-blue-600 dark:hover:text-blue-400 bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 hover:shadow-sm"
                    }`}
                    onClick={() => loadRecent(u.id)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <button
                        className={`text-left flex-1 transition-colors font-medium ${
                          selectedUser === u.id
                            ? // Different styling for selected user button
                              "text-blue-700 dark:text-blue-300"
                            : "hover:text-blue-600 dark:hover:text-blue-400"
                        }`}
                        onClick={() => loadRecent(u.id)}
                      >
                        {displayName(u)}
                        {selectedUser === u.id && (
                          <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                            geselecteerd
                          </span>
                        )}
                      </button>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            if (
                              kasIds.has(u.id)
                                ? confirm(`Wil je ${displayName(u)} verwijderen als kas?`)
                                : confirm(`Wil je ${displayName(u)} kas maken?`)
                            ) {
                              toggleKas(u.id, !kasIds.has(u.id))
                            }
                          }}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                            kasIds.has(u.id)
                              ? // Removed jittery hover effects, using only color transitions
                                "bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 shadow-md hover:from-yellow-500 hover:to-yellow-600"
                              : "bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-500"
                          }`}
                          disabled={loading}
                          title={kasIds.has(u.id) ? "Kas intrekken" : "Kas toekennen"}
                        >
                          {kasIds.has(u.id) ? "KAS" : "Maak KAS"}
                        </button>

                        {/* Quick add dropdown */}
                        <DropdownMenu
                          open={openQuickFor === u.id}
                          onOpenChange={(open) => {
                            setOpenQuickFor(open ? u.id : openQuickFor === u.id ? null : openQuickFor)
                          }}
                        >
                          <DropdownMenuTrigger asChild>
                            <button
                              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm hover:bg-slate-100 dark:hover:bg-slate-600 inline-flex items-center gap-1 transition-colors duration-200"
                              title="Snel toevoegen"
                              aria-expanded={openQuickFor === u.id}
                            >
                              {openQuickFor === u.id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="p-4 w-72 space-y-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl"
                          >
                            {/* Raketten */}
                            <div className="space-y-3">
                              <div className="text-sm font-semibold text-green-700 dark:text-green-400">Raketten</div>
                              <div className="flex items-center gap-3">
                                <input
                                  type="number"
                                  min={1}
                                  className="w-20 rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-700"
                                  value={getQty(u.id).raket}
                                  onChange={(e) => setQtyField(u.id, "raket", Number(e.target.value))}
                                />
                                <button
                                  className="flex-1 h-10 px-3 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm font-medium disabled:opacity-50 transition-colors duration-200"
                                  disabled={loading}
                                  onClick={() => addLogFor(u.id, "raket", getQty(u.id).raket)}
                                >
                                  Log raket
                                </button>
                              </div>
                            </div>
                            {/* ND-drinks */}
                            <div className="space-y-3">
                              <div className="text-sm font-semibold text-pink-700 dark:text-pink-400">ND-drinks</div>
                              <div className="flex items-center gap-3">
                                <input
                                  type="number"
                                  min={1}
                                  className="w-20 rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-700"
                                  value={getQty(u.id).fris}
                                  onChange={(e) => setQtyField(u.id, "fris", Number(e.target.value))}
                                />
                                <button
                                  className="flex-1 h-10 px-3 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white text-sm font-medium disabled:opacity-50 transition-colors duration-200"
                                  disabled={loading}
                                  onClick={() => addLogFor(u.id, "fris", getQty(u.id).fris)}
                                >
                                  Log ND
                                </button>
                              </div>
                            </div>
                            {/* Strepen */}
                            <div className="space-y-3">
                              <div className="text-sm font-semibold text-blue-700 dark:text-blue-400">Strepen</div>
                              <div className="flex items-center gap-3">
                                <input
                                  type="number"
                                  min={1}
                                  className="w-20 rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-700"
                                  value={getQty(u.id).streep}
                                  onChange={(e) => setQtyField(u.id, "streep", Number(e.target.value))}
                                />
                                <button
                                  className="flex-1 h-10 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-medium disabled:opacity-50 transition-colors duration-200"
                                  disabled={loading}
                                  onClick={() => addLogFor(u.id, "streep", getQty(u.id).streep)}
                                >
                                  Log streep
                                </button>
                              </div>
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Recent actions */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-700 dark:to-slate-600 p-6 border-b border-slate-200 dark:border-slate-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold dtext-slate-800 dark:text-slate-100">Laatste acties</h2>
                    
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm("Zeker dat je deze actie(s) ongedaan wilt maken?")) {
                      undoSelected()
                    }
                  }}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition-colors duration-200 font-medium text-sm"
                  disabled={!selectedActions.size || loading}
                >
                  <RotateCcw className="w-4 h-4" />
                  Ongedaan maken
                </button>
              </div>
            </div>
            <div className="p-6">
              <ul className="space-y-3 max-h-80 overflow-y-auto">
                {recent.map((r) => (
                  <li
                    key={r.entry_id}
                    className="flex items-center gap-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-4 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200"
                  >
                    <input
                      type="checkbox"
                      checked={selectedActions.has(r.entry_id)}
                      onChange={(e) => {
                        const next = new Set(selectedActions)
                        if (e.target.checked) {
                          next.add(r.entry_id)
                        } else {
                          next.delete(r.entry_id)
                        }
                        setSelectedActions(next)
                      }}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {r.kind} · {r.amount}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date(r.ts).toLocaleString()}
                      </div>
                    </div>
                    <span
                      className={`text-xs rounded-full px-3 py-1 font-medium ${
                        r.table_name.includes("raket")
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : r.table_name.includes("frisdrank")
                            ? "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}
                    >
                      {r.table_name.replace("_logs", "")}
                    </span>
                  </li>
                ))}

                {!recent.length && (
                  <li className="text-center py-8 text-slate-500 dark:text-slate-400">Geen recente acties.</li>
                )}

                {recentHasMore && (
                  <li>
                    <button
                      onClick={loadMoreRecent}
                      disabled={loading}
                      className="w-full px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors duration-200 font-medium text-slate-700 dark:text-slate-200"
                    >
                      Meer laden
                    </button>
                  </li>
                )}
              </ul>
            </div>
          </section>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <RekeningOverview rows={rekeningRows} loading={rekeningLoading} />
        </div>
      </div>
    </main>
  )
}
