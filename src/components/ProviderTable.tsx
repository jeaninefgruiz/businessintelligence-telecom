import { useState } from "react";
import { Provider } from "@/lib/providers";

export function ProviderTable({ rows, onSelect, pageSize = 25 }: {
  rows: Provider[];
  onSelect: (p: Provider) => void;
  pageSize?: number;
}) {
  const [page, setPage] = useState(0);
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safe = Math.min(page, pageCount - 1);
  const shown = rows.slice(safe * pageSize, safe * pageSize + pageSize);

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>
              {["Provedor", "UF", "Município", "Porte", "ERP", "ASN", "Produtos", ""].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((p, i) => (
              <tr key={i} onClick={() => onSelect(p)} style={{ cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(79,142,247,0.06)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <td style={tdStyle}>
                  <div style={{ maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
                    {p.fantasia || p.nome || "—"}
                  </div>
                </td>
                <td style={tdStyle}>{p.uf || "—"}</td>
                <td style={{ ...tdStyle, color: "var(--text2)" }}>{p.municipio || "—"}</td>
                <td style={{ ...tdStyle, color: "var(--text2)", fontSize: 11 }}>{p.porte || "—"}</td>
                <td style={tdStyle}>{p.erp || <span style={{ color: "var(--text3)" }}>—</span>}</td>
                <td style={tdStyle}>{p.asn ? `AS${p.asn}` : <span style={{ color: "var(--text3)" }}>—</span>}</td>
                <td style={tdStyle}>
                  {p.celeti && <Dot label="C" color="var(--blue)" />}
                  {p.hub && <Dot label="H" color="var(--teal)" />}
                  {p.cdn && <Dot label="D" color="var(--coral)" />}
                  {p.rami && <Dot label="R" color="var(--amber)" />}
                </td>
                <td style={{ ...tdStyle, color: "var(--blue)", fontSize: 11 }}>Ver →</td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr><td colSpan={8} style={{ ...tdStyle, textAlign: "center", color: "var(--text3)", padding: 32 }}>Nenhum provedor encontrado com os filtros atuais.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, fontSize: 11, color: "var(--text3)" }}>
        <span>{total.toLocaleString("pt-BR")} provedores · página {safe + 1} de {pageCount}</span>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setPage(Math.max(0, safe - 1))} disabled={safe === 0} style={pageBtn}>‹ Anterior</button>
          <button onClick={() => setPage(Math.min(pageCount - 1, safe + 1))} disabled={safe >= pageCount - 1} style={pageBtn}>Próxima ›</button>
        </div>
      </div>
    </div>
  );
}

function Dot({ label, color }: { label: string; color: string }) {
  return <span style={{
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: 18, height: 18, borderRadius: 4, background: color, color: "#0E1117",
    fontSize: 10, fontWeight: 700, marginRight: 3,
  }}>{label}</span>;
}

const thStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 500, color: "var(--text3)", textAlign: "left",
  padding: "8px 10px", borderBottom: "1px solid var(--border-c)",
  textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap",
};
const tdStyle: React.CSSProperties = {
  padding: "10px", borderBottom: "1px solid rgba(38,48,73,0.5)", color: "var(--text)",
  verticalAlign: "middle",
};
const pageBtn: React.CSSProperties = {
  background: "transparent", border: "1px solid var(--border-c)", color: "var(--text2)",
  borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 11,
};
