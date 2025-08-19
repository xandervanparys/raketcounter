import type { RekeningRow } from "@/types";

export default function RekeningOverview({ rows, loading }: { rows: RekeningRow[]; loading: boolean }) {
    // CSV helpers
    const csvEscape = (val: unknown) => {
      const s = String(val ?? "");
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
  
    const downloadCsv = () => {
      if (!rows.length) return;
      const headers = [
        "profile_id",
        "display_name",
        "raket_total",
        "fris_total",
        "streep_total",
      ];
      const body = rows.map((r) =>
        [
          r.profile_id,
          r.display_name ?? "",
          r.raket_total,
          r.fris_total,
          r.streep_total,
        ]
          .map(csvEscape)
          .join(",")
      );
      const csv = [headers.join(","), ...body].join("\n");
      const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rekening_alltime_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    };
  
    const downloadXlsx = async () => {
      if (!rows.length) return;
      try {
        const XLSX = await import("xlsx");
        const data = rows.map((r) => ({
          display_name: r.display_name ?? r.profile_id.slice(0, 8),
          raket_total: r.raket_total,
          fris_total: r.fris_total,
          streep_total: r.streep_total,
        }));
        const ws = XLSX.utils.json_to_sheet(data, {
          header: ["display_name", "raket_total", "fris_total", "streep_total"],
        });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Rekening");
        const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([wbout], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `rekening_alltime_${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Excel export failed, falling back to CSV", err);
        downloadCsv();
      }
    };
  
    return (
      <section className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Rekening (all-time)</h2>
          <button
            onClick={downloadXlsx}
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
  