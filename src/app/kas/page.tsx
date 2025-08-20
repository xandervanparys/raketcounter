"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { House, ChevronDown, ChevronUp } from "lucide-react";
import RekeningOverview, { exportRekeningXlsx } from "@/components/RekeningOverview";
import type { RekeningRow } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function useRekeningAllTime() {
  const [rows, setRows] = useState<RekeningRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('rekening_alltime');
    if (!error && data) {
      setRows(data as RekeningRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void refetch();
  }, []);

  return { rows, loading, refetch };
}

type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  email?: string | null;
};
type ActionRow = {
  entry_id: string;
  table_name: "raket_logs" | "strepen_logs" | "frisdrank_logs";
  kind: string;
  amount: number;
  ts: string;
};

export default function KasDashboard() {
  const router = useRouter();
  const [kasChecked, setKasChecked] = useState(false);
  const [isKas, setIsKas] = useState(false);
  const [users, setUsers] = useState<Profile[]>([]);
  const [kasIds, setKasIds] = useState<Set<string>>(new Set());
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [recent, setRecent] = useState<ActionRow[]>([]);
  const [selectedActions, setSelectedActions] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Track which user's quick-add dropdown is open (for chevron up/down)
  const [openQuickFor, setOpenQuickFor] = useState<string | null>(null);

  // Per-user quantities for quick logging
  const [qtyByUser, setQtyByUser] = useState<Record<string, { raket: number; fris: number; streep: number }>>({});

  const getQty = (userId: string) => {
    return (
      qtyByUser[userId] || { raket: 1, fris: 1, streep: 1 }
    );
  };

  const setQtyField = (userId: string, field: "raket" | "fris" | "streep", value: number) => {
    setQtyByUser((prev) => ({
      ...prev,
      [userId]: { ...getQty(userId), [field]: Math.max(1, Math.floor(value || 1)) },
    }));
  };

  const addLogFor = async (
    userId: string,
    kind: "raket" | "fris" | "streep",
    amount: number
  ) => {
    if (loading) return;
    setLoading(true);
    try {
      let table: "raket_logs" | "frisdrank_logs" | "strepen_logs";
      if (kind === "raket") table = "raket_logs";
      else if (kind === "fris") table = "frisdrank_logs";
      else table = "strepen_logs";

      const { error } = await supabase.from(table).insert({
        profile_id: userId,
        amount,
      });
      if (error) throw error;

      // If we are viewing this user's recent actions, refresh it
      if (selectedUser === userId) {
        await loadRecent(userId);
      }
      await refetchRekening();
    } catch (e) {
      console.error(e);
      alert("Toevoegen mislukt.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void (async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        router.replace("/login");
        return;
      }
      const { data: kasRes, error: kasErr } = await supabase.rpc("is_kas");
      if (kasErr || !kasRes) {
        router.replace("/404");
        return;
      }
      setIsKas(true);
      setKasChecked(true);
    })();
  }, [router]);

  useEffect(() => {
    if (!isKas) return;
    void (async () => {
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("id, username, full_name");
      if (pErr) return;

      // emails (optional): join via auth if you’ve mirrored emails somewhere;
      // or skip email entirely on the KAS screen.
      const list: Profile[] = (profiles ?? []).map((p) => ({
        id: p.id,
        username: p.username,
        full_name: p.full_name,
      }));
      setUsers(list);

      // current KAS set
      const { data: roles, error: rErr } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (rErr) return;
      setKasIds(
        new Set(
          (roles ?? []).filter((r) => r.role === "kas").map((r) => r.user_id)
        )
      );
    })();
  }, [isKas]);

  const { rows: rekeningRows, loading: rekeningLoading, refetch: refetchRekening } = useRekeningAllTime();

  const displayName = (u: Profile) =>
    (u.username && u.username.trim() !== "" ? u.username : u.full_name) ??
    u.id.slice(0, 8);

  const toggleKas = async (userId: string, makeKas: boolean) => {
    setLoading(true);
    try {
      if (makeKas) {
        const { error } = await supabase.rpc("kas_grant", { target: userId });
        if (error) throw error;
        setKasIds((prev) => new Set(prev).add(userId));
      } else {
        const { error } = await supabase.rpc("kas_revoke", { target: userId });
        if (error) throw error;
        setKasIds((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      }
    } catch (e) {
      console.error(e);
      alert("Kon rol niet aanpassen.");
    } finally {
      setLoading(false);
    }
  };

  const loadRecent = async (userId: string) => {
    setSelectedUser(userId);
    setSelectedActions(new Set());
    const { data, error } = await supabase.rpc("recent_actions_for_user", {
      target: userId,
      n: 5,
    });
    if (error) {
      console.error(error);
      return;
    }
    setRecent(data ?? []);
  };

  const undoSelected = async () => {
    if (!selectedActions.size) return;
    setLoading(true);
    try {
      const rows = recent.filter((r) => selectedActions.has(r.entry_id));
      for (const r of rows) {
        const { error } = await supabase.rpc("undo_action", {
          action_table: r.table_name,
          action_id: r.entry_id,
        });
        if (error) throw error;
      }
      if (selectedUser) await loadRecent(selectedUser);
      await refetchRekening();
    } catch (e) {
      console.error(e);
      alert("Ongedaan maken mislukt.");
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setShowResetConfirm(true);
  };

  if (!kasChecked) return null;
  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 bg-gray-200 text-gray-900 px-4 py-2 rounded hover:bg-gray-300"
            aria-label="Home"
            title="Home"
          >
            <House className="w-4 h-4" />
            <span>Home</span>
          </button>
          <h1 className="text-2xl font-bold">KAS</h1>
        </div>

        <button
          onClick={resetAll}
          className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={loading}
        >
          Database resetten
        </button>
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowResetConfirm(false)} />
          <div className="relative z-10 w-full max-w-md rounded-lg border bg-white p-5 shadow-lg dark:bg-gray-900 dark:border-gray-800">
            <h3 className="text-lg font-semibold mb-2">Database resetten</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Je staat op het punt om <strong>alle logs</strong> (raket, strepen, frisdrank) te verwijderen.
              Wil je eerst de huidige rekening als Excel downloaden?
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded border border-gray-300 text-gray-800 dark:text-gray-200 dark:border-gray-700"
              >
                Annuleren
              </button>
              <button
                onClick={async () => {
                  try {
                    setIsDownloading(true);
                    await exportRekeningXlsx(rekeningRows);
                  } finally {
                    setIsDownloading(false);
                  }
                }}
                disabled={isDownloading}
                className="px-4 py-2 rounded bg-emerald-600 text-white disabled:opacity-50"
              >
                {isDownloading ? "Downloaden..." : "Download Excel"}
              </button>
              <button
                onClick={async () => {
                  setShowResetConfirm(false);
                  setLoading(true);
                  try {
                    const { data, error } = await supabase.rpc("reset_all_logs");
                    if (error) throw error;
                    alert(`Reset OK: ${JSON.stringify(data)}`);
                    if (selectedUser) await loadRecent(selectedUser);
                    await refetchRekening();
                  } catch (e) {
                    console.error(e);
                    alert("Reset mislukt.");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="px-4 py-2 rounded bg-red-600 text-white"
              >
                Reset zonder download
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Users */}
        <section className="border rounded-lg p-4">
          <h2 className="font-semibold mb-3">Gebruikers</h2>
          <ul className="space-y-2 max-h-[420px] overflow-auto">
            {users.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between gap-2"
              >
                <button
                  className="text-left flex-1 hover:underline"
                  onClick={() => loadRecent(u.id)}
                >
                  {displayName(u)}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (
                        kasIds.has(u.id)
                          ? confirm(`Wil je ${displayName(u)} verwijderen als kas?`)
                          : confirm(`Wil je ${displayName(u)} kas maken?`)
                      ) {
                        toggleKas(u.id, !kasIds.has(u.id));
                      }
                    }}
                    className={`px-3 py-1 rounded text-sm ${
                      kasIds.has(u.id)
                        ? "bg-yellow-500 text-black"
                        : "bg-gray-200 text-gray-900"
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
                      setOpenQuickFor(open ? u.id : (openQuickFor === u.id ? null : openQuickFor));
                    }}
                  >
                    <DropdownMenuTrigger asChild>
                      <button
                        className="px-2 py-1 rounded border text-sm hover:bg-gray-50 dark:hover:bg-gray-800 inline-flex items-center gap-1"
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
                    <DropdownMenuContent align="end" className="p-3 w-64 space-y-3">
                      {/* Raketten */}
                      <div className="space-y-2">
                        <div className="text-xs font-medium">Raketten</div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            className="w-20 rounded border px-2 py-1 text-sm"
                            value={getQty(u.id).raket}
                            onChange={(e) => setQtyField(u.id, "raket", Number(e.target.value))}
                          />
                          <button
                            className="px-2 py-1 rounded bg-green-600 text-white text-xs disabled:opacity-50"
                            disabled={loading}
                            onClick={() => addLogFor(u.id, "raket", getQty(u.id).raket)}
                          >
                            Log raket
                          </button>
                        </div>
                      </div>
                      {/* ND-drinks */}
                      <div className="space-y-2">
                        <div className="text-xs font-medium">ND-drinks</div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            className="w-20 rounded border px-2 py-1 text-sm"
                            value={getQty(u.id).fris}
                            onChange={(e) => setQtyField(u.id, "fris", Number(e.target.value))}
                          />
                          <button
                            className="px-2 py-1 rounded bg-pink-600 text-white text-xs disabled:opacity-50"
                            disabled={loading}
                            onClick={() => addLogFor(u.id, "fris", getQty(u.id).fris)}
                          >
                            Log ND
                          </button>
                        </div>
                      </div>
                      {/* Strepen */}
                      <div className="space-y-2">
                        <div className="text-xs font-medium">Strepen</div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            className="w-20 rounded border px-2 py-1 text-sm"
                            value={getQty(u.id).streep}
                            onChange={(e) => setQtyField(u.id, "streep", Number(e.target.value))}
                          />
                          <button
                            className="px-2 py-1 rounded bg-blue-600 text-white text-xs disabled:opacity-50"
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
              </li>
            ))}
          </ul>
        </section>

        {/* Recent actions */}
        <section className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">
              Laatste acties {selectedUser ? "" : "(selecteer gebruiker)"}
            </h2>
            <button
              onClick={() => {
                if (
                  confirm("Zeker dat je deze actie(s) ongedaan wilt maken?")
                ) {
                  undoSelected();
                }
              }}
              className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
              disabled={!selectedActions.size || loading}
            >
              Geselecteerde ongedaan maken
            </button>
          </div>
          <ul className="space-y-2">
            {recent.map((r) => (
              <li
                key={r.entry_id}
                className="flex items-center gap-3 border rounded p-2"
              >
                <input
                  type="checkbox"
                  checked={selectedActions.has(r.entry_id)}
                  onChange={(e) => {
                    const next = new Set(selectedActions);
                    if (e.target.checked) {
                      next.add(r.entry_id);
                    } else {
                      next.delete(r.entry_id);
                    }
                    setSelectedActions(next);
                  }}
                />
                <div className="flex-1">
                  <div className="font-medium">
                    {r.kind} · {r.amount}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(r.ts).toLocaleString()}
                  </div>
                </div>
                <span className="text-xs rounded bg-gray-100 px-2 py-0.5">
                  {r.table_name.replace("_logs", "")}
                </span>
              </li>
            ))}
            {!recent.length && (
              <li className="text-sm text-gray-500">Geen recente acties.</li>
            )}
          </ul>
        </section>
      </div>

      {/* Rekening all-time */}
      <RekeningOverview rows={rekeningRows} loading={rekeningLoading} />
    </main>
  );
}
