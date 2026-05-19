import { useRef } from "react";
import { Provider } from "@/lib/providers";

export function QuickShortcuts({
  data, potencial, setPotencial, listRef,
}: {
  data: Provider[] | null;
  potencial: string;
  setPotencial: (v: any) => void;
  listRef: React.RefObject<HTMLDivElement | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  function go(v: string) {
    setPotencial(potencial === v ? "" : v);
    setTimeout(() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }
  const cards = [
    { key: "celeti", label: "Não-clientes Celeti", color: "var(--blue)", count: data?.filter(p => !p.celeti).length },
    { key: "hub",    label: "Não-clientes Hub",    color: "var(--teal)", count: data?.filter(p => !p.hub).length },
    { key: "cdn",    label: "Não-clientes CDN",    color: "var(--coral)", count: data?.filter(p => !p.cdn).length },
    { key: "rami",   label: "Não-clientes Rami",   color: "var(--amber)", count: data?.filter(p => !p.rami).length },
    { key: "any",    label: "Sem nenhum produto",  color: "var(--text2)", count: data?.filter(p => !p.celeti && !p.hub && !p.cdn && !p.rami).length },
  ];
  return (
    <div ref={ref} style={{ background: "var(--bg2)", border: "1px solid var(--border-c)", borderRadius: "var(--radius)", padding: 20, marginTop: 16, marginBottom: 16 }}>
      <div style={{ fontFamily: "var(--font-head)", fontSize: 13, fontWeight: 600, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--coral)" }} />
        Atalhos de prospecção rápida
      </div>
      <p style={{ fontSize: 12, color: "var(--text2)", marginBottom: 14 }}>
        Clique em um card para aplicar o filtro e rolar até a lista de provedores.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
        {cards.map(c => {
          const active = potencial === c.key;
          return (
            <button key={c.key} onClick={() => go(c.key)} style={{
              background: active ? c.color : "var(--bg3)",
              color: active ? "#fff" : "var(--text)",
              border: `1px solid ${active ? c.color : "var(--border-c)"}`,
              borderRadius: 8, padding: "14px 16px", cursor: "pointer",
              fontFamily: "var(--font-body)", textAlign: "left",
              display: "flex", flexDirection: "column", gap: 4,
              transition: "all .15s",
            }}>
              <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", opacity: 0.85 }}>{c.label}</span>
              <span style={{ fontFamily: "var(--font-head)", fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
                {c.count != null ? c.count.toLocaleString("pt-BR") : "—"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
