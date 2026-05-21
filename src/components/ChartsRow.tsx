import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LabelList,
} from "recharts";
import { Provider } from "@/lib/providers";
import { maturidadeAnos, maturidadeFaixa, emailStatusKind } from "@/lib/score";

const PALETTE = ["#4F8EF7", "#3DD68C", "#F7A84F", "#F76F6F", "#4FD6D6", "#8B5CF6", "#F7C94F", "#64B5F6", "#A5D6A7", "#FFB74D"];

export function ChartsRow({ providers }: { providers: Provider[] }) {
  const uf = useMemo(() => {
    const c: Record<string, number> = {};
    providers.forEach(p => { if (p.uf) c[p.uf] = (c[p.uf] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([name, value]) => ({ name, value }));
  }, [providers]);

  const erp = useMemo(() => {
    const c: Record<string, number> = {};
    providers.forEach(p => { if (p.erp && !/sem erp/i.test(p.erp)) c[p.erp] = (c[p.erp] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value }));
  }, [providers]);

  const porte = useMemo(() => {
    const c: Record<string, number> = {};
    providers.forEach(p => { const k = p.porte || "—"; c[k] = (c[k] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [providers]);

  const prod = useMemo(() => {
    let ce = 0, hu = 0, cd = 0, ra = 0;
    providers.forEach(p => { if (p.celeti) ce++; if (p.hub) hu++; if (p.cdn) cd++; if (p.rami) ra++; });
    const t = providers.length;
    return [
      { name: "Celeti", clientes: ce, "não-clientes": t - ce },
      { name: "Celeti Hub", clientes: hu, "não-clientes": t - hu },
      { name: "CDN", clientes: cd, "não-clientes": t - cd },
      { name: "Rami", clientes: ra, "não-clientes": t - ra },
    ];
  }, [providers]);

  const matur = useMemo(() => {
    const buckets = { "< 2 anos": 0, "2–5 anos": 0, "5–10 anos": 0, "> 10 anos": 0 };
    providers.forEach(p => {
      const a = maturidadeAnos(p.abertura);
      const f = maturidadeFaixa(a);
      if (f in buckets) buckets[f as keyof typeof buckets]++;
    });
    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  }, [providers]);

  const emailDist = useMemo(() => {
    const c = { "Válido": 0, "Inválido": 0, "Inconclusivo": 0, "Sem e-mail": 0 };
    providers.forEach(p => {
      const k = emailStatusKind(p.email_status);
      if (k === "valido" && p.email) c["Válido"]++;
      else if (k === "invalido") c["Inválido"]++;
      else if (k === "inconclusivo" && p.email) c["Inconclusivo"]++;
      else c["Sem e-mail"]++;
    });
    return Object.entries(c).map(([name, value]) => ({ name, value }));
  }, [providers]);

  const completude = useMemo(() => {
    const t = providers.length || 1;
    const fields: [string, (p: Provider) => boolean][] = [
      ["CNPJ", p => !!p.cnpj],
      ["Sócio", p => !!p.socio],
      ["ASN", p => p.asn != null],
      ["E-mail", p => !!p.email],
      ["Telefone", p => !!(p.tel || p.tel2 || p.tel3 || p.tel4 || p.tel5)],
      ["ERP", p => !!p.erp],
      ["Assinantes", p => p.assinantes != null],
    ];
    return fields.map(([label, fn]) => {
      const n = providers.reduce((acc, p) => acc + (fn(p) ? 1 : 0), 0);
      return { label, pct: Math.round((n / t) * 100), n };
    });
  }, [providers]);

  const tickStyle = { fontSize: 10, fill: "var(--text2)" };
  const emailColorOf = (n: string) =>
    n === "Válido" ? "#3DD68C" : n === "Inválido" ? "#F76F6F" : n === "Inconclusivo" ? "#F7A84F" : "#4A5878";

  return (
    <>
      <div className="row2">
        <Card title="Top 15 UFs por nº de provedores" dot="var(--blue)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={uf} layout="vertical" margin={{ left: 8, right: 28 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-c)" />
              <XAxis type="number" tick={tickStyle} stroke="var(--border-c)" />
              <YAxis type="category" dataKey="name" tick={tickStyle} stroke="var(--border-c)" width={36} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--bg3)", opacity: 0.4 }} />
              <Bar dataKey="value" fill="#4F8EF7" radius={[0, 3, 3, 0]}>
                <LabelList dataKey="value" position="right" style={{ fill: "var(--text2)", fontSize: 10 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Market share de ERP (top 10, excl. sem ERP)" dot="var(--amber)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={erp} layout="vertical" margin={{ left: 8, right: 28 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-c)" />
              <XAxis type="number" tick={tickStyle} stroke="var(--border-c)" />
              <YAxis type="category" dataKey="name" tick={{ ...tickStyle, fontSize: 10 }} stroke="var(--border-c)" width={110} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--bg3)", opacity: 0.4 }} />
              <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                {erp.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                <LabelList dataKey="value" position="right" style={{ fill: "var(--text2)", fontSize: 10 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="row2">
        <Card title="Clientes vs não-clientes por produto" dot="var(--green)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={prod}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-c)" />
              <XAxis dataKey="name" tick={tickStyle} stroke="var(--border-c)" />
              <YAxis tick={tickStyle} stroke="var(--border-c)" />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="clientes" stackId="a" fill="#4F8EF7" />
              <Bar dataKey="não-clientes" stackId="a" fill="#263049" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Distribuição por porte" dot="var(--teal)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={porte} layout="vertical" margin={{ left: 8, right: 28 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-c)" />
              <XAxis type="number" tick={tickStyle} stroke="var(--border-c)" />
              <YAxis type="category" dataKey="name" tick={tickStyle} stroke="var(--border-c)" width={100} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--bg3)", opacity: 0.4 }} />
              <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                {porte.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                <LabelList dataKey="value" position="right" style={{ fill: "var(--text2)", fontSize: 10 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="row2">
        <Card title="Maturidade — anos desde abertura" dot="var(--amber)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={matur}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-c)" />
              <XAxis dataKey="name" tick={tickStyle} stroke="var(--border-c)" />
              <YAxis tick={tickStyle} stroke="var(--border-c)" />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" fill="#F7A84F" radius={[3, 3, 0, 0]}>
                <LabelList dataKey="value" position="top" style={{ fill: "var(--text2)", fontSize: 10 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Status de e-mail" dot="var(--coral)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={emailDist} layout="vertical" margin={{ left: 8, right: 28 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-c)" />
              <XAxis type="number" tick={tickStyle} stroke="var(--border-c)" />
              <YAxis type="category" dataKey="name" tick={tickStyle} stroke="var(--border-c)" width={90} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--bg3)", opacity: 0.4 }} />
              <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                {emailDist.map((d, i) => <Cell key={i} fill={emailColorOf(d.name)} />)}
                <LabelList dataKey="value" position="right" style={{ fill: "var(--text2)", fontSize: 10 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div style={{ background: "var(--bg2)", border: "1px solid var(--border-c)", borderRadius: "var(--radius)", padding: 20, marginBottom: 16 }}>
        <div style={titleStyle}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} />Completude da base por campo</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginTop: 8 }}>
          {completude.map(c => (
            <div key={c.label}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text2)", marginBottom: 4 }}>
                <span>{c.label}</span>
                <span style={{ color: "var(--text)", fontWeight: 600 }}>{c.pct}% <span style={{ color: "var(--text3)" }}>({c.n.toLocaleString("pt-BR")})</span></span>
              </div>
              <div style={{ height: 6, background: "var(--bg3)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${c.pct}%`, height: "100%", background: c.pct > 70 ? "var(--green)" : c.pct > 40 ? "var(--amber)" : "var(--coral)" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

const tooltipStyle: React.CSSProperties = {
  background: "var(--bg2)", border: "1px solid var(--border-c)", borderRadius: 6,
  fontSize: 12, color: "var(--text)",
};
const titleStyle: React.CSSProperties = {
  fontFamily: "var(--font-head)", fontSize: 13, fontWeight: 600, letterSpacing: "0.03em",
  marginBottom: 14, display: "flex", alignItems: "center", gap: 8,
};

function Card({ title, dot, children }: { title: string; dot: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--bg2)", border: "1px solid var(--border-c)", borderRadius: "var(--radius)", padding: 20 }}>
      <div style={titleStyle}><span style={{ width: 6, height: 6, borderRadius: "50%", background: dot }} />{title}</div>
      {children}
    </div>
  );
}
