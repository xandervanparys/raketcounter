import type { RekeningRow } from "@/types";

// --- Shared uniform export helpers (used by KAS page & this component) ---
export function formatRekeningForExport(rows: RekeningRow[]) {
  const headers = ["Naam", "Raketten", "ND’s", "Strepen"] as const;
  const data = rows.map((r) => [
    r.display_name ?? r.profile_id.slice(0, 8),
    Number(r.raket_total ?? 0),
    Number(r.fris_total ?? 0),
    Number(r.streep_total ?? 0),
  ]);
  return { headers: Array.from(headers), data };
}

export async function exportRekeningXlsx(
  rows: RekeningRow[],
  filenameBase = `rekening_alltime_${new Date().toISOString().slice(0, 10)}`
) {
  if (!rows.length) return;
  const { headers, data } = formatRekeningForExport(rows);
  const XLSX = await import("xlsx");
  // Build worksheet from an array of arrays to control headers & order
  const aoa = [headers, ...data];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Rekening");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenameBase}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportRekeningCsv(
  rows: RekeningRow[],
  filenameBase = `rekening_alltime_${new Date().toISOString().slice(0, 10)}`
) {
  if (!rows.length) return;
  const { headers, data } = formatRekeningForExport(rows);
  const csvEscape = (val: unknown) => {
    const s = String(val ?? "");
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const body = data.map((row) => row.map(csvEscape).join(","));
  const csv = [headers.join(","), ...body].join("\n");
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenameBase}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
// --- end helpers ---

export default function RekeningOverview({ rows, loading }: { rows: RekeningRow[]; loading: boolean }) {
  return (
    <section className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Rekening (all-time)</h2>
        <button
          onClick={() => exportRekeningXlsx(rows)}
          disabled={!rows.length || loading}
          className="px-3 py-1.5 rounded text-sm bg-emerald-600 text-white disabled:opacity-50 hover:bg-emerald-700"
          title={rows.length ? "Download Excel" : "Geen data"}
        >
          Download Excel
        </button>
      </div>
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
            {loading ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-gray-500">
                  Laden...
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.profile_id} className="border-b last:border-0">
                  <td className="py-2 pr-3">
                    {r.display_name ?? r.profile_id.slice(0, 8)}
                  </td>
                  <td className="py-2 pr-3">{r.raket_total}</td>
                  <td className="py-2 pr-3">{r.fris_total}</td>
                  <td className="py-2">{r.streep_total}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}