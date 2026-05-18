import { useMemo, useState } from "react";
import { Provider } from "@/lib/providers";
import { nearestPTT, cdnPriority, CdnPriority } from "@/lib/ptt";

type Row = Provider & { _ptt: string; _km: number; _prio: CdnPriority };

export function CdnPotentialSection({ providers, onSelect }: {
  providers: Provider[];
  onSelect: (p: Provider) => void;
}) {
  const [tab, setTab] = useState<CdnPriority | "todos">("alta");
  const [busca, setBusca] = useState("");
  const [ufFilter, setUfFilter] = useState("");
  const [sortKey, setSortKey] = useState<"km" | "nome" | "uf" | "municipio">("km");
  const [asc, setAsc] = useState(false);

  // Enriquecer apenas não-clientes CDN com distância ao PTT
  const enriched = useMemo<Row[]>(() => {
    const out: Row[] = [];
    for (const p of providers) {
      if (p.cdn) continue; // só potenciais
      const np = nearestPTT(p.uf);
      if (!np) continue;
      out.push({ ...p, _ptt: np.ptt, _km: np.km, _prio: cdnPriority(np.km) });
    }
    return out;
  }, [providers]);

  const ufs = useMemo(() => [...new Set(enriched.map(r => r.uf).filter(Boolean) as string[])].sort(), [enriched]);

  const filtered = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const list = enriched.filter(r => {
      if (tab !== "todos" && r._prio !== tab) return false;
      if (ufFilter && r.uf !== ufFilter) return false;
      if (q) {
        const hay = `${r.nome || ""} ${r.fantasia || ""} ${r.municipio || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    list.sort((a, b) => {
      let va: string | number = "", vb: string | number = "";
      if (sortKey === "km") { va = a._km; vb = b._km; }
      else if (sortKey === "nome") { va = (a.fantasia || a.nome || "").toLowerCase(); vb = (b.fantasia || b.nome || "").toLowerCase(); }
      else if (sortKey === "uf") { va = a.uf || ""; vb = b.uf || ""; }
      else { va = a.municipio || ""; vb = b.municipio || ""; }
      if (typeof va === "number" && typeof vb === "number") return asc ? va - vb : vb - va;
      return asc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
    return list;
  }, [enriched, tab, ufFilter, busca, sortKey, asc]);

  const counts = useMemo(() => {
    let alta = 0, media = 0, baixa = 0;
    enriched.forEach(r => { if (r._prio === "alta") alta++; else if (r._prio === "media") media++; else baixa++; });
    return { alta, media, baixa, total: enriched.length };
  }, [enriched]);

  const maxKm = useMemo(() => Math.max(1, ...enriched.map(r => r._km)), [enriched]);
  const shown = filtered.slice(0, 50);

  function toggleSort(k: typeof sortKey) {
    if (sortKey === k) setAsc(!asc);
    else { setSortKey(k); setAsc(k !== "km"); }
  }

  return (
    <div style={{ background: "var(--bg2)", border: "1px solid var(--border-c)", borderRadius: "var(--radius)", padding: 20, marginTop: 16 }}>
      <div style={{ fontFamily: "var(--font-head)", fontSize: 13, fontWeight: 600, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--coral)" }} />
        Potencial CDN — provedores sem CDN mais distantes dos PTTs IX.br
      </div>
      <p style={{ fontSize: 12, color: "var(--text2)", marginBottom: 14 }}>
        Distância geográfica ao IX.br mais próximo como proxy de necessidade de CDN. Maior distância = maior ganho potencial de performance e latência para o usuário final. Considera UF do provedor x localização dos PTTs.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 4 }}>
          <Tab active={tab === "alta"}  onClick={() => setTab("alta")}>Alta &gt;1.000 km <Pill>{counts.alta.toLocaleString("pt-BR")}</Pill></Tab>
          <Tab active={tab === "media"} onClick={() => setTab("media")}>Média 500–1.000 km <Pill>{counts.media.toLocaleString("pt-BR")}</Pill></Tab>
          <Tab active={tab === "baixa"} onClick={() => setTab("baixa")}>Baixa &lt;500 km <Pill>{counts.baixa.toLocaleString("pt-BR")}</Pill></Tab>
          <Tab active={tab === "todos"} onClick={() => setTab("todos")}>Todos <Pill>{counts.total.toLocaleString("pt-BR")}</Pill></Tab>
        </div>
        <input
          placeholder="Buscar provedor ou município..."
          value={busca} onChange={e => setBusca(e.target.value)}
          style={inputStyle}
        />
        <select value={ufFilter} onChange={e => setUfFilter(e.target.value)} style={inputStyle}>
          <option value="">Todas UFs</option>
          {ufs.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>
              <Th onClick={() => toggleSort("nome")} arrow={sortKey === "nome" ? (asc ? "↑" : "↓") : ""}>Provedor</Th>
              <Th onClick={() => toggleSort("uf")} arrow={sortKey === "uf" ? (asc ? "↑" : "↓") : ""}>UF</Th>
              <Th onClick={() => toggleSort("municipio")} arrow={sortKey === "municipio" ? (asc ? "↑" : "↓") : ""}>Município</Th>
              <Th>PTT mais próximo</Th>
              <Th onClick={() => toggleSort("km")} arrow={sortKey === "km" ? (asc ? "↑" : "↓") : ""}>Distância km</Th>
              <Th>Prioridade</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => {
              const color = r._prio === "alta" ? "var(--coral)" : r._prio === "media" ? "var(--amber)" : "var(--green)";
              const bg = r._prio === "alta" ? "var(--coral-dim)" : r._prio === "media" ? "var(--amber-dim)" : "var(--green-dim)";
              const label = r._prio === "alta" ? "Alta" : r._prio === "media" ? "Média" : "Baixa";
              const pct = Math.round((r._km / maxKm) * 100);
              return (
                <tr key={i} onClick={() => onSelect(r)} style={{ cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(247,111,111,0.05)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={tdStyle}>
                    <div style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
                      {r.fantasia || r.nome || "—"}
                    </div>
                  </td>
                  <td style={tdStyle}>{r.uf}</td>
                  <td style={{ ...tdStyle, color: "var(--text2)" }}>{r.municipio || "—"}</td>
                  <td style={{ ...tdStyle, color: "var(--text3)", fontSize: 11 }}>{r._ptt}</td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ minWidth: 44, fontWeight: 600, color }}>{r._km.toLocaleString("pt-BR")}</span>
                      <div style={{ flex: 1, height: 3, background: "var(--bg3)", borderRadius: 2, minWidth: 50, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: color }} />
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ display: "inline-block", fontSize: 10, padding: "2px 8px", borderRadius: 4, fontWeight: 600, background: bg, color }}>{label}</span>
                  </td>
                  <td style={{ ...tdStyle, color: "var(--blue)", fontSize: 11 }}>Ver →</td>
                </tr>
              );
            })}
            {shown.length === 0 && (
              <tr><td colSpan={7} style={{ ...tdStyle, textAlign: "center", color: "var(--text3)", padding: 32 }}>Nenhum provedor encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 10 }}>
        Exibindo {shown.length.toLocaleString("pt-BR")} de {filtered.length.toLocaleString("pt-BR")} potenciais filtrados · {counts.total.toLocaleString("pt-BR")} não-clientes CDN na base atual
      </div>
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      fontSize: 12, padding: "5px 12px", cursor: "pointer", borderRadius: 6,
      border: `1px solid ${active ? "var(--blue)" : "var(--border-c)"}`,
      color: active ? "var(--blue)" : "var(--text2)",
      background: active ? "var(--blue-dim)" : "transparent",
      fontFamily: "var(--font-body)", fontWeight: active ? 600 : 400,
      display: "inline-flex", alignItems: "center", gap: 6,
    }}>{children}</button>
  );
}
function Pill({ children }: { children: React.ReactNode }) {
  return <span style={{ background: "rgba(255,255,255,0.06)", padding: "1px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{children}</span>;
}
function Th({ children, onClick, arrow }: { children?: React.ReactNode; onClick?: () => void; arrow?: string }) {
  return (
    <th onClick={onClick} style={{
      fontSize: 10, fontWeight: 500, color: "var(--text3)", textAlign: "left",
      padding: "8px 10px", borderBottom: "1px solid var(--border-c)",
      textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap",
      cursor: onClick ? "pointer" : "default", userSelect: "none",
    }}>{children} {arrow && <span style={{ color: "var(--blue)" }}>{arrow}</span>}</th>
  );
}

const tdStyle: React.CSSProperties = {
  padding: "10px", borderBottom: "1px solid rgba(38,48,73,0.5)", color: "var(--text)", verticalAlign: "middle",
};
const inputStyle: React.CSSProperties = {
  background: "var(--bg3)", border: "1px solid var(--border-c)", borderRadius: 6,
  color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 12,
  padding: "6px 10px", height: 32, outline: "none", minWidth: 180,
};
