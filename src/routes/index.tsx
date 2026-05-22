import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Provider, loadProviders } from "@/lib/providers";
import { ProviderTable } from "@/components/ProviderTable";
import { ProviderDrawer } from "@/components/ProviderDrawer";
import { ChartsRow } from "@/components/ChartsRow";
import { CdnPotentialSection } from "@/components/CdnPotentialSection";
import { BrazilMap } from "@/components/BrazilMap";
import { QuickShortcuts } from "@/components/QuickShortcuts";
import { ScoreExplainer } from "@/components/ScoreExplainer";
import { providerScore, emailStatusKind, maturidadeAnos, toCsv, downloadCsv, Score } from "@/lib/score";
import { nearestPTT, cdnPriority } from "@/lib/ptt";
import { useTheme } from "@/lib/theme";
import {
  Users, Building2, Globe2, Network, Mail, ShieldCheck, Target, Sun, Moon, Download, FileDown,
} from "lucide-react";

export const Route = createFileRoute("/")({ component: Dashboard });

type ProductFilter = "" | "celeti" | "hub" | "cdn" | "rami";
type PotentialFilter = "" | "celeti" | "hub" | "cdn" | "rami" | "any";

function Dashboard() {
  const { mode, toggle } = useTheme();
  const [data, setData] = useState<Provider[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filtros globais
  const [ufs, setUfs] = useState<string[]>([]);
  const [porte, setPorte] = useState("");
  const [erp, setErp] = useState("");
  const [produto, setProduto] = useState<ProductFilter>("");
  const [potencial, setPotencial] = useState<PotentialFilter>("");
  const [scoreF, setScoreF] = useState<"" | Score>("");
  const [emailF, setEmailF] = useState("");
  const [prioCdn, setPrioCdn] = useState<"" | "alta" | "media" | "baixa">("");
  const [faixaAss, setFaixaAss] = useState("");
  const [maturF, setMaturF] = useState("");
  const [asnF, setAsnF] = useState<"" | "com" | "sem">("");
  const [busca, setBusca] = useState("");
  const [selected, setSelected] = useState<Provider | null>(null);

  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadProviders().then(setData).catch(e => setError(String(e))); }, []);

  const dims = useMemo(() => {
    if (!data) return { ufList: [], portes: [], erps: [] };
    const u = new Set<string>(), pr = new Set<string>(), e = new Set<string>();
    data.forEach(r => { if (r.uf) u.add(r.uf); if (r.porte) pr.add(r.porte); if (r.erp) e.add(r.erp); });
    return { ufList: [...u].sort(), portes: [...pr].sort(), erps: [...e].sort() };
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = busca.trim().toLowerCase();
    return data.filter(r => {
      if (ufs.length && (!r.uf || !ufs.includes(r.uf))) return false;
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
      if (scoreF && providerScore(r) !== scoreF) return false;
      if (emailF) {
        const k = emailStatusKind(r.email_status);
        if (emailF === "valido" && !(k === "valido" && r.email)) return false;
        if (emailF === "invalido" && k !== "invalido") return false;
        if (emailF === "inconclusivo" && !(k === "inconclusivo" && r.email)) return false;
        if (emailF === "sem" && r.email) return false;
      }
      if (prioCdn) {
        if (r.cdn) return false;
        const np = nearestPTT(r.uf);
        if (!np || cdnPriority(np.km) !== prioCdn) return false;
      }
      if (faixaAss) {
        const a = r.assinantes ?? -1;
        if (faixaAss === "<100" && !(a >= 0 && a < 100)) return false;
        if (faixaAss === "100-500" && !(a >= 100 && a < 500)) return false;
        if (faixaAss === "500-2000" && !(a >= 500 && a < 2000)) return false;
        if (faixaAss === ">2000" && !(a >= 2000)) return false;
      }
      if (maturF) {
        const yr = maturidadeAnos(r.abertura);
        if (yr == null) return false;
        if (maturF === "<2" && !(yr < 2)) return false;
        if (maturF === "2-5" && !(yr >= 2 && yr < 5)) return false;
        if (maturF === "5-10" && !(yr >= 5 && yr < 10)) return false;
        if (maturF === ">10" && !(yr >= 10)) return false;
      }
      if (asnF === "com" && r.asn == null) return false;
      if (asnF === "sem" && r.asn != null) return false;
      if (q) {
        const hay = `${r.nome || ""} ${r.fantasia || ""} ${r.municipio || ""} ${r.cnpj || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data, ufs, porte, erp, produto, potencial, scoreF, emailF, prioCdn, faixaAss, maturF, asnF, busca]);

  const kpis = useMemo(() => {
    const total = filtered.length;
    let ce = 0, hu = 0, cd = 0, ra = 0, em = 0, naoCliente = 0, alto = 0;
    filtered.forEach(r => {
      if (r.celeti) ce++; if (r.hub) hu++; if (r.cdn) cd++; if (r.rami) ra++;
      if (r.email) em++;
      if (!r.celeti && !r.hub && !r.cdn && !r.rami) naoCliente++;
      if (providerScore(r) === "alto") alto++;
    });
    return { total, ce, hu, cd, ra, em, naoCliente, alto };
  }, [filtered]);

  function reset() {
    setUfs([]); setPorte(""); setErp(""); setProduto(""); setPotencial("");
    setScoreF(""); setEmailF(""); setPrioCdn(""); setFaixaAss(""); setMaturF(""); setAsnF(""); setBusca("");
  }

  function exportVisao() {
    if (!filtered.length) return;
    const rows = filtered.map(p => {
      const np = nearestPTT(p.uf);
      return { ...p, score: providerScore(p), ptt_proximo: np?.ptt, distancia_km: np?.km };
    });
    downloadCsv(`provedores_visao_${Date.now()}.csv`, toCsv(rows as any));
  }
  function exportLeads() {
    const rows = filtered.filter(p => {
      const s = providerScore(p);
      return (s === "alto" || s === "medio") && p.email && emailStatusKind(p.email_status) === "valido";
    }).map(p => {
      const np = nearestPTT(p.uf);
      return { ...p, score: providerScore(p), ptt_proximo: np?.ptt, distancia_km: np?.km };
    });
    if (!rows.length) return alert("Nenhum lead qualificado na visão atual.");
    downloadCsv(`leads_qualificados_${Date.now()}.csv`, toCsv(rows as any));
  }

  return (
    <div>
      <nav style={{
        background: "var(--bg2)", borderBottom: "1px solid var(--border-c)",
        padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 16, letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--blue)" }} />
          SUPERCOMM
          <span style={{ color: "var(--text3)", fontWeight: 400, fontSize: 13, marginLeft: 6 }}>/ Inteligência de Mercado ISP</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 12, color: "var(--text3)" }}>
            {data ? `${data.length.toLocaleString("pt-BR")} provedores na base` : "Carregando..."}
          </span>
          <button onClick={toggle} title="Alternar tema" style={iconBtn} aria-label="Alternar tema">
            {mode === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 24px 60px" }}>
        <h1 style={{ fontFamily: "var(--font-head)", fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Mercado ISP Brasil</h1>
        <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20 }}>Painel estratégico de inteligência competitiva, prospecção e consultoria comercial</p>

        {error && <div style={{ color: "var(--coral)", marginBottom: 16 }}>Erro ao carregar dados: {error}</div>}

        {/* a) Filtros globais */}
        <div style={filtersWrap}>
          <FG label="UF">
            <MultiSelect options={dims.ufList} value={ufs} onChange={setUfs} placeholder="Todas" />
          </FG>
          <FG label="Porte">
            <select style={selectStyle} value={porte} onChange={e => setPorte(e.target.value)}>
              <option value="">Todos</option>
              {dims.portes.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </FG>
          <FG label="ERP">
            <select style={selectStyle} value={erp} onChange={e => setErp(e.target.value)}>
              <option value="">Todos</option>
              {dims.erps.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </FG>
          <FG label="Cliente de">
            <select style={selectStyle} value={produto} onChange={e => setProduto(e.target.value as ProductFilter)}>
              <option value="">Qualquer</option>
              <option value="celeti">Celeti</option>
              <option value="hub">Celeti Hub</option>
              <option value="cdn">CDN</option>
              <option value="rami">Rami</option>
            </select>
          </FG>
          <FG label="Não-cliente">
            <select style={selectStyle} value={potencial} onChange={e => setPotencial(e.target.value as PotentialFilter)}>
              <option value="">—</option>
              <option value="any">Nenhum produto</option>
              <option value="celeti">Não-cliente Celeti</option>
              <option value="hub">Não-cliente Hub</option>
              <option value="cdn">Não-cliente CDN</option>
              <option value="rami">Não-cliente Rami</option>
            </select>
          </FG>
          <FG label="Score">
            <select style={selectStyle} value={scoreF} onChange={e => setScoreF(e.target.value as any)}>
              <option value="">Todos</option>
              <option value="alto">Alto</option>
              <option value="medio">Médio</option>
              <option value="baixo">Baixo</option>
            </select>
          </FG>
          <FG label="E-mail">
            <select style={selectStyle} value={emailF} onChange={e => setEmailF(e.target.value)}>
              <option value="">Todos</option>
              <option value="valido">Válido</option>
              <option value="invalido">Inválido</option>
              <option value="inconclusivo">Inconclusivo</option>
              <option value="sem">Sem e-mail</option>
            </select>
          </FG>
          <FG label="Prioridade CDN">
            <select style={selectStyle} value={prioCdn} onChange={e => setPrioCdn(e.target.value as any)}>
              <option value="">Todas</option>
              <option value="alta">Alta (&gt;1.000 km)</option>
              <option value="media">Média (500–1.000)</option>
              <option value="baixa">Baixa (&lt;500)</option>
            </select>
          </FG>
          <FG label="Assinantes">
            <select style={selectStyle} value={faixaAss} onChange={e => setFaixaAss(e.target.value)}>
              <option value="">Todas</option>
              <option value="<100">&lt; 100</option>
              <option value="100-500">100–500</option>
              <option value="500-2000">500–2.000</option>
              <option value=">2000">&gt; 2.000</option>
            </select>
          </FG>
          <FG label="Maturidade">
            <select style={selectStyle} value={maturF} onChange={e => setMaturF(e.target.value)}>
              <option value="">Todas</option>
              <option value="<2">&lt; 2 anos</option>
              <option value="2-5">2–5 anos</option>
              <option value="5-10">5–10 anos</option>
              <option value=">10">&gt; 10 anos</option>
            </select>
          </FG>
          <FG label="ASN">
            <select style={selectStyle} value={asnF} onChange={e => setAsnF(e.target.value as any)}>
              <option value="">Todos</option>
              <option value="com">Com ASN</option>
              <option value="sem">Sem ASN</option>
            </select>
          </FG>
          <FG label="Buscar">
            <input style={{ ...selectStyle, minWidth: 200 }} placeholder="Nome, município, CNPJ..." value={busca} onChange={e => setBusca(e.target.value)} />
          </FG>
          <div style={{ display: "flex", gap: 8, marginLeft: "auto", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--text2)" }}><b style={{ color: "var(--blue)" }}>{filtered.length.toLocaleString("pt-BR")}</b> provedores na visão</span>
            <button onClick={reset} style={btnGhost}>Limpar filtros</button>
            <button onClick={exportVisao} style={btnPrimary} title="Exportar todos os provedores filtrados"><Download size={13} /> CSV</button>
            <button onClick={exportLeads} style={btnGhost} title="Exportar apenas leads Alto/Médio com e-mail válido"><FileDown size={13} /> Leads</button>
          </div>
        </div>

        {/* b) KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
          <Kpi icon={<Users size={14} />} color="var(--text)"  label="Filtrados"        value={kpis.total} sub="provedores" />
          <Kpi icon={<Target size={14} />} color="var(--coral)" label="Score Alto"      value={kpis.alto}    sub={pct(kpis.alto, kpis.total)} />
          <Kpi icon={<Building2 size={14} />} color="var(--blue)"  label="Clientes Celeti"  value={kpis.ce}    sub={pct(kpis.ce, kpis.total)} />
          <Kpi icon={<Network size={14} />} color="var(--teal)"  label="Clientes Hub"     value={kpis.hu}    sub={pct(kpis.hu, kpis.total)} />
          <Kpi icon={<Globe2 size={14} />} color="var(--coral)" label="Clientes CDN"     value={kpis.cd}    sub={pct(kpis.cd, kpis.total)} />
          <Kpi icon={<ShieldCheck size={14} />} color="var(--amber)" label="Clientes Rami"    value={kpis.ra}    sub={pct(kpis.ra, kpis.total)} />
          <Kpi icon={<Mail size={14} />} color="var(--green)" label="Com e-mail"       value={kpis.em}    sub={pct(kpis.em, kpis.total)} />
          <Kpi icon={<Users size={14} />} color="var(--text3)" label="Sem nenhum produto" value={kpis.naoCliente} sub={pct(kpis.naoCliente, kpis.total)} />
        </div>

        {/* Explicação do score */}
        <ScoreExplainer />

        {/* c) Gráficos */}
        {data ? <ChartsRow providers={filtered} /> : <SkeletonRows />}

        {/* d) Mapa */}
        {data && <BrazilMap providers={filtered} />}

        {/* e) Atalhos de prospecção rápida */}
        <QuickShortcuts data={data} potencial={potencial} setPotencial={setPotencial} listRef={listRef} />

        {/* f) Lista de provedores */}
        <div ref={listRef} style={{ background: "var(--bg2)", border: "1px solid var(--border-c)", borderRadius: "var(--radius)", padding: 20 }}>
          <div style={{ fontFamily: "var(--font-head)", fontSize: 13, fontWeight: 600, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--blue)" }} />
            Lista de provedores · clique em uma linha para ver todos os dados
          </div>
          {data ? <ProviderTable rows={filtered} onSelect={setSelected} /> : <SkeletonRows />}
        </div>

        {/* Potencial CDN */}
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
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-head)" }}>{label}</span>
      {children}
    </div>
  );
}

function Kpi({ icon, color, label, value, sub }: { icon: React.ReactNode; color: string; label: string; value: number; sub: string }) {
  return (
    <div style={{ background: "var(--bg2)", border: "1px solid var(--border-c)", borderRadius: "var(--radius)", padding: "14px 16px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: color }} />
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
        <span style={{ color }}>{icon}</span>{label}
      </div>
      <div style={{ fontFamily: "var(--font-head)", fontSize: 22, fontWeight: 700, lineHeight: 1, color, marginBottom: 4 }}>{value.toLocaleString("pt-BR")}</div>
      <div style={{ fontSize: 10, color: "var(--text3)" }}>{sub}</div>
    </div>
  );
}

function MultiSelect({ options, value, onChange, placeholder }: { options: string[]; value: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", onClick); return () => document.removeEventListener("mousedown", onClick);
  }, []);
  const label = value.length === 0 ? placeholder : value.length <= 2 ? value.join(", ") : `${value.length} selecionadas`;
  function toggle(o: string) { onChange(value.includes(o) ? value.filter(v => v !== o) : [...value, o]); }
  return (
    <div ref={ref} style={{ position: "relative", minWidth: 130 }}>
      <button onClick={() => setOpen(!open)} style={{ ...selectStyle, width: "100%", textAlign: "left", cursor: "pointer" }}>
        {label} <span style={{ float: "right", color: "var(--text3)" }}>▾</span>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, marginTop: 4, zIndex: 50, minWidth: 180,
          background: "var(--bg2)", border: "1px solid var(--border-c)", borderRadius: 6,
          maxHeight: 260, overflowY: "auto", padding: 4,
        }}>
          {options.map(o => (
            <label key={o} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", fontSize: 12, cursor: "pointer", borderRadius: 4 }}>
              <input type="checkbox" checked={value.includes(o)} onChange={() => toggle(o)} />{o}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function SkeletonRows() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ height: 40, background: "var(--bg3)", borderRadius: 6, opacity: 0.5 - i * 0.06 }} />
      ))}
    </div>
  );
}

const filtersWrap: React.CSSProperties = {
  background: "var(--bg2)", border: "1px solid var(--border-c)", borderRadius: "var(--radius)",
  padding: "14px 16px", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end", marginBottom: 16,
};
const selectStyle: React.CSSProperties = {
  background: "var(--bg3)", border: "1px solid var(--border-c)", borderRadius: 6,
  color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 12,
  padding: "6px 10px", height: 32, outline: "none", minWidth: 110,
};
const btnGhost: React.CSSProperties = {
  background: "transparent", border: "1px solid var(--border-c)", borderRadius: 6,
  color: "var(--text2)", fontFamily: "var(--font-body)", fontSize: 12,
  padding: "6px 12px", height: 32, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
};
const btnPrimary: React.CSSProperties = {
  background: "var(--blue-dim)", border: "1px solid var(--blue)", borderRadius: 6,
  color: "var(--blue)", fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600,
  padding: "6px 12px", height: 32, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
};
const iconBtn: React.CSSProperties = {
  background: "var(--bg3)", border: "1px solid var(--border-c)", color: "var(--text)",
  borderRadius: 6, padding: "6px 8px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
};
