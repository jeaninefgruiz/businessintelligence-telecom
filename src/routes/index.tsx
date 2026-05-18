import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Provider, loadProviders } from "@/lib/providers";
import { ProviderTable } from "@/components/ProviderTable";
import { ProviderDrawer } from "@/components/ProviderDrawer";
import { ChartsRow } from "@/components/ChartsRow";
import { CdnPotentialSection } from "@/components/CdnPotentialSection";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

type ProductFilter = "" | "celeti" | "hub" | "cdn" | "rami";
type PotentialFilter = "" | "celeti" | "hub" | "cdn" | "rami" | "any";

function Dashboard() {
  const [data, setData] = useState<Provider[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uf, setUf] = useState("");
  const [porte, setPorte] = useState("");
  const [erp, setErp] = useState("");
  const [produto, setProduto] = useState<ProductFilter>("");
  const [potencial, setPotencial] = useState<PotentialFilter>("");
  const [busca, setBusca] = useState("");
  const [selected, setSelected] = useState<Provider | null>(null);

  useEffect(() => {
    loadProviders().then(setData).catch(e => setError(String(e)));
  }, []);

  const { ufs, portes, erps } = useMemo(() => {
    if (!data) return { ufs: [], portes: [], erps: [] };
    const u = new Set<string>(), p = new Set<string>(), e = new Set<string>();
    data.forEach(r => {
      if (r.uf) u.add(r.uf);
      if (r.porte) p.add(r.porte);
      if (r.erp) e.add(r.erp);
    });
    return {
      ufs: [...u].sort(),
      portes: [...p].sort(),
      erps: [...e].sort(),
    };
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = busca.trim().toLowerCase();
    return data.filter(r => {
      if (uf && r.uf !== uf) return false;
      if (porte && r.porte !== porte) return false;
      if (erp && r.erp !== erp) return false;
      if (produto === "celeti" && !r.celeti) return false;
      if (produto === "hub" && !r.hub) return false;
      if (produto === "cdn" && !r.cdn) return false;
      if (produto === "rami" && !r.rami) return false;
      if (potencial === "celeti" && r.celeti) return false;
      if (potencial === "hub" && r.hub) return false;
      if (potencial === "cdn" && r.cdn) return false;
      if (potencial === "rami" && r.rami) return false;
      if (potencial === "any" && (r.celeti || r.hub || r.cdn || r.rami)) return false;
      if (q) {
        const hay = `${r.nome || ""} ${r.fantasia || ""} ${r.municipio || ""} ${r.cnpj || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data, uf, porte, erp, produto, potencial, busca]);

  const kpis = useMemo(() => {
    const total = filtered.length;
    let ce = 0, hu = 0, cd = 0, ra = 0, em = 0, naoCliente = 0;
    filtered.forEach(r => {
      if (r.celeti) ce++;
      if (r.hub) hu++;
      if (r.cdn) cd++;
      if (r.rami) ra++;
      if (r.email) em++;
      if (!r.celeti && !r.hub && !r.cdn && !r.rami) naoCliente++;
    });
    return { total, ce, hu, cd, ra, em, naoCliente };
  }, [filtered]);

  function reset() {
    setUf(""); setPorte(""); setErp(""); setProduto(""); setPotencial(""); setBusca("");
  }

  return (
    <div>
      <nav style={{
        background: "var(--bg2)", borderBottom: "1px solid var(--border-c)",
        padding: "0 32px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 16, letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--blue)" }} />
          SUPERCOMM
          <span style={{ color: "var(--text3)", fontWeight: 400, fontSize: 13, marginLeft: 6 }}>/ Inteligência de Mercado ISP</span>
        </div>
        <div style={{ fontSize: 12, color: "var(--text3)" }}>
          {data ? `${data.length.toLocaleString("pt-BR")} provedores · base consolidada` : "Carregando base..."}
        </div>
      </nav>

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 32px 60px" }}>
        <h1 style={{ fontFamily: "var(--font-head)", fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Mercado ISP Brasil</h1>
        <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 24 }}>
          Painel estratégico de inteligência competitiva e oportunidades comerciais
        </p>

        {error && <div style={{ color: "var(--coral)", marginBottom: 16 }}>Erro ao carregar dados: {error}</div>}

        {/* Filters */}
        <div style={filtersWrap}>
          <FG label="UF">
            <select style={selectStyle} value={uf} onChange={e => setUf(e.target.value)}>
              <option value="">Todas</option>
              {ufs.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </FG>
          <Sep />
          <FG label="Porte">
            <select style={selectStyle} value={porte} onChange={e => setPorte(e.target.value)}>
              <option value="">Todos</option>
              {portes.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </FG>
          <Sep />
          <FG label="ERP">
            <select style={selectStyle} value={erp} onChange={e => setErp(e.target.value)}>
              <option value="">Todos</option>
              {erps.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </FG>
          <Sep />
          <FG label="Cliente de">
            <select style={selectStyle} value={produto} onChange={e => setProduto(e.target.value as ProductFilter)}>
              <option value="">Todos</option>
              <option value="celeti">Celeti</option>
              <option value="hub">Celeti Hub</option>
              <option value="cdn">CDN</option>
              <option value="rami">Rami</option>
            </select>
          </FG>
          <Sep />
          <FG label="Potencial cliente">
            <select style={selectStyle} value={potencial} onChange={e => setPotencial(e.target.value as PotentialFilter)}>
              <option value="">—</option>
              <option value="any">Nenhum produto (qualquer um)</option>
              <option value="celeti">Não-cliente Celeti</option>
              <option value="hub">Não-cliente Celeti Hub</option>
              <option value="cdn">Não-cliente CDN</option>
              <option value="rami">Não-cliente Rami</option>
            </select>
          </FG>
          <Sep />
          <FG label="Buscar">
            <input style={{ ...selectStyle, width: 220 }} placeholder="Nome, município ou CNPJ..." value={busca} onChange={e => setBusca(e.target.value)} />
          </FG>
          <button onClick={reset} style={btnReset}>Limpar filtros</button>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 12, marginBottom: 24 }}>
          <Kpi color="var(--text)"  label="Filtrados"        value={kpis.total} sub="provedores na visão atual" />
          <Kpi color="var(--blue)"  label="Clientes Celeti"  value={kpis.ce}    sub={pct(kpis.ce, kpis.total)} />
          <Kpi color="var(--teal)"  label="Clientes Hub"     value={kpis.hu}    sub={pct(kpis.hu, kpis.total)} />
          <Kpi color="var(--coral)" label="Clientes CDN"     value={kpis.cd}    sub={pct(kpis.cd, kpis.total)} />
          <Kpi color="var(--amber)" label="Clientes Rami"    value={kpis.ra}    sub={pct(kpis.ra, kpis.total)} />
          <Kpi color="var(--green)" label="Com e-mail"       value={kpis.em}    sub={pct(kpis.em, kpis.total)} />
          <Kpi color="var(--text3)" label="Sem nenhum produto" value={kpis.naoCliente} sub={pct(kpis.naoCliente, kpis.total)} />
        </div>

        {data && <ChartsRow providers={filtered} />}

        {/* Table */}
        <div style={{ background: "var(--bg2)", border: "1px solid var(--border-c)", borderRadius: "var(--radius)", padding: 20, marginTop: 16 }}>
          <div style={{ fontFamily: "var(--font-head)", fontSize: 13, fontWeight: 600, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--blue)" }} />
            Lista de provedores · clique em uma linha para ver todos os dados
          </div>
          {data ? <ProviderTable rows={filtered} onSelect={setSelected} /> : <SkeletonRows />}
        </div>

        {/* Potencial Clientes */}
        <div style={{ background: "var(--bg2)", border: "1px solid var(--border-c)", borderRadius: "var(--radius)", padding: 20, marginTop: 16 }}>
          <div style={{ fontFamily: "var(--font-head)", fontSize: 13, fontWeight: 600, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--coral)" }} />
            Possíveis clientes — atalhos rápidos
          </div>
          <p style={{ fontSize: 12, color: "var(--text2)", marginBottom: 14 }}>
            Provedores que ainda não são clientes em cada produto. Use os filtros acima para refinar por UF, porte ou ERP.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <PotBtn label="Não-clientes Celeti" count={data?.filter(p => !p.celeti).length} color="var(--blue)"  active={potencial === "celeti"} onClick={() => setPotencial(potencial === "celeti" ? "" : "celeti")} />
            <PotBtn label="Não-clientes Hub"    count={data?.filter(p => !p.hub).length}    color="var(--teal)"  active={potencial === "hub"}    onClick={() => setPotencial(potencial === "hub" ? "" : "hub")} />
            <PotBtn label="Não-clientes CDN"    count={data?.filter(p => !p.cdn).length}    color="var(--coral)" active={potencial === "cdn"}    onClick={() => setPotencial(potencial === "cdn" ? "" : "cdn")} />
            <PotBtn label="Não-clientes Rami"   count={data?.filter(p => !p.rami).length}   color="var(--amber)" active={potencial === "rami"}   onClick={() => setPotencial(potencial === "rami" ? "" : "rami")} />
            <PotBtn label="Sem nenhum produto"  count={data?.filter(p => !p.celeti && !p.hub && !p.cdn && !p.rami).length} color="var(--text2)" active={potencial === "any"} onClick={() => setPotencial(potencial === "any" ? "" : "any")} />
          </div>
        </div>

        {data && <CdnPotentialSection providers={filtered} onSelect={setSelected} />}
      </main>

      <ProviderDrawer p={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function pct(n: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((n / total) * 100)}% do filtro`;
}

function FG({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{label}</span>
      {children}
    </div>
  );
}
function Sep() { return <div style={{ width: 1, height: 20, background: "var(--border-c)" }} />; }

function Kpi({ color, label, value, sub }: { color: string; label: string; value: number; sub: string }) {
  return (
    <div style={{ background: "var(--bg2)", border: "1px solid var(--border-c)", borderRadius: "var(--radius)", padding: "16px 18px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: color }} />
      <div style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-head)", fontSize: 24, fontWeight: 700, lineHeight: 1, color, marginBottom: 4 }}>{value.toLocaleString("pt-BR")}</div>
      <div style={{ fontSize: 11, color: "var(--text3)" }}>{sub}</div>
    </div>
  );
}

function PotBtn({ label, count, color, active, onClick }: { label: string; count: number | undefined; color: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: active ? color : "var(--bg3)",
      color: active ? "#0E1117" : "var(--text)",
      border: `1px solid ${active ? color : "var(--border-c)"}`,
      borderRadius: 8, padding: "10px 14px", cursor: "pointer",
      fontFamily: "var(--font-body)", fontSize: 12, fontWeight: active ? 600 : 500,
      display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2, minWidth: 160,
    }}>
      <span>{label}</span>
      <span style={{ fontFamily: "var(--font-head)", fontSize: 18, fontWeight: 700 }}>
        {count != null ? count.toLocaleString("pt-BR") : "—"}
      </span>
    </button>
  );
}

function SkeletonRows() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ height: 32, background: "var(--bg3)", borderRadius: 4, opacity: 0.4 - i * 0.04 }} />
      ))}
    </div>
  );
}

const filtersWrap: React.CSSProperties = {
  background: "var(--bg2)", border: "1px solid var(--border-c)", borderRadius: "var(--radius)",
  padding: "14px 18px", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 24,
};
const selectStyle: React.CSSProperties = {
  background: "var(--bg3)", border: "1px solid var(--border-c)", borderRadius: 6,
  color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 12,
  padding: "6px 10px", height: 32, outline: "none",
};
const btnReset: React.CSSProperties = {
  background: "transparent", border: "1px solid var(--border-c)", borderRadius: 6,
  color: "var(--text2)", fontFamily: "var(--font-body)", fontSize: 12,
  padding: "6px 14px", height: 32, cursor: "pointer", marginLeft: "auto",
};

declare global { interface HTMLElementTagNameMap { } }
