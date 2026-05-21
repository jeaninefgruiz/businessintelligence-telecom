import { useEffect, useMemo, useRef, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { Provider } from "@/lib/providers";
import { PTTS, UF_COORDS, nearestPTT } from "@/lib/ptt";

type Feature = {
  type: "Feature";
  properties: { sigla?: string; name?: string; SIGLA_UF?: string; NM_UF?: string };
  geometry: any;
};
type FC = { type: "FeatureCollection"; features: Feature[] };

const PTT_HIGHLIGHT = ["IX.br SP", "IX.br RJ", "IX.br FOR", "IX.br POA", "IX.br BSB", "IX.br BEL", "IX.br MAN", "IX.br SAL", "IX.br REC", "IX.br CWB"];

// Paleta distinta por PTT — usada para colorir linhas/bolhas/legenda dos ASNs
const PTT_COLORS: Record<string, string> = {
  "IX.br SP":  "#4F8EF7",
  "IX.br RJ":  "#F76F6F",
  "IX.br POA": "#3DD68C",
  "IX.br CWB": "#F7A84F",
  "IX.br BH":  "#8B5CF6",
  "IX.br FLN": "#4FD6D6",
  "IX.br BSB": "#F7C94F",
  "IX.br FOR": "#FF7AB6",
  "IX.br REC": "#A78BFA",
  "IX.br SAL": "#22D3EE",
  "IX.br BEL": "#FB923C",
  "IX.br MAN": "#84CC16",
  "IX.br VIX": "#E879F9",
  "IX.br CGB": "#94A3B8",
  "IX.br GYN": "#FACC15",
  "IX.br NAT": "#F472B6",
  "IX.br JPA": "#60A5FA",
  "IX.br MCZ": "#34D399",
  "IX.br SLZ": "#FCA5A5",
  "IX.br TER": "#A3E635",
  "IX.br ARU": "#C084FC",
  "IX.br CGR": "#FBBF24",
  "IX.br LDB": "#2DD4BF",
  "IX.br MGF": "#FB7185",
};
const pttColor = (n: string) => PTT_COLORS[n] || "#9CA3AF";

const UF_NAME: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia",
  CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás",
  MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais",
  PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí",
  RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RS: "Rio Grande do Sul",
  RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo",
  SE: "Sergipe", TO: "Tocantins",
};
const NAME_TO_UF = Object.fromEntries(Object.entries(UF_NAME).map(([k, v]) => [v.toLowerCase(), k]));

type Metric = "total" | "asn" | "cdn";

export function BrazilMap({ providers }: { providers: Provider[] }) {
  const [geo, setGeo] = useState<FC | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number; html: string } | null>(null);
  const [metric, setMetric] = useState<Metric>("asn");
  const [highlightPtt, setHighlightPtt] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(800);

  useEffect(() => {
    fetch("https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson")
      .then(r => r.json()).then(setGeo).catch(() => setGeo(null));
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(es => setW(Math.max(320, es[0].contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const stats = useMemo(() => {
    const total: Record<string, number> = {}, ce: Record<string, number> = {}, naoCdn: Record<string, number> = {}, asn: Record<string, number> = {};
    providers.forEach(p => {
      if (!p.uf) return;
      total[p.uf] = (total[p.uf] || 0) + 1;
      if (p.celeti) ce[p.uf] = (ce[p.uf] || 0) + 1;
      if (!p.cdn) naoCdn[p.uf] = (naoCdn[p.uf] || 0) + 1;
      if (p.asn != null) asn[p.uf] = (asn[p.uf] || 0) + 1;
    });
    const ptt: Record<string, { name: string; km: number }> = {};
    Object.keys(UF_COORDS).forEach(uf => {
      const n = nearestPTT(uf);
      if (n) ptt[uf] = { name: n.ptt, km: n.km };
    });
    // ASNs agrupados por PTT (com base no PTT mais próximo da UF)
    const asnByPtt: Record<string, { count: number; ufs: { uf: string; count: number; km: number }[] }> = {};
    Object.entries(asn).forEach(([uf, c]) => {
      const p = ptt[uf]; if (!p) return;
      if (!asnByPtt[p.name]) asnByPtt[p.name] = { count: 0, ufs: [] };
      asnByPtt[p.name].count += c;
      asnByPtt[p.name].ufs.push({ uf, count: c, km: p.km });
    });
    const asnByPttSorted = Object.entries(asnByPtt)
      .map(([name, v]) => ({ name, count: v.count, ufs: v.ufs.sort((a, b) => b.count - a.count) }))
      .sort((a, b) => b.count - a.count);
    return { total, ce, naoCdn, asn, ptt, asnByPttSorted };
  }, [providers]);

  const values = metric === "asn" ? stats.asn : metric === "cdn" ? stats.naoCdn : stats.total;
  const max = Math.max(1, ...Object.values(values));

  const colorFn = (v: number) => {
    const t = v / max;
    const a = 0.10 + t * 0.55;
    if (metric === "asn") return `rgba(61,214,140,${a})`;
    if (metric === "cdn") return `rgba(247,168,79,${a})`;
    return `rgba(79,142,247,${a})`;
  };

  const h = Math.round(w * 0.95);

  const projection = useMemo(() => {
    if (!geo) return null;
    return geoMercator().fitSize([w, h], geo as any);
  }, [geo, w, h]);
  const path = projection ? geoPath(projection) : null;

  function ufOf(f: Feature): string | null {
    const p = f.properties || {};
    if (p.sigla) return p.sigla.toUpperCase();
    if (p.SIGLA_UF) return p.SIGLA_UF.toUpperCase();
    const nm = p.name || p.NM_UF;
    if (nm) return NAME_TO_UF[nm.toLowerCase()] || null;
    return null;
  }

  const metricLabel = metric === "asn" ? "ASNs conectados por PTT IX.br" : metric === "cdn" ? "Potencial CDN (sem CDN)" : "Total de provedores";
  const accent = metric === "asn" ? "#3DD68C" : metric === "cdn" ? "#F7A84F" : "#4F8EF7";

  const btnStyle = (active: boolean, c: string): React.CSSProperties => ({
    padding: "4px 10px", fontSize: 11, borderRadius: 6, cursor: "pointer",
    border: `1px solid ${active ? c : "var(--border-c)"}`,
    background: active ? c : "transparent",
    color: active ? "#fff" : "var(--text2)",
    fontFamily: "var(--font-body)", fontWeight: 500, transition: "all .15s",
  });

  return (
    <div style={{ background: "var(--bg2)", border: "1px solid var(--border-c)", borderRadius: "var(--radius)", padding: 20, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 6 }}>
        <div>
          <div style={{ fontFamily: "var(--font-head)", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: accent }} />
            {metricLabel}
          </div>
          <p style={{ fontSize: 12, color: "var(--text2)", marginTop: 6 }}>
            {metric === "asn"
              ? "Cada bolha verde mostra quantos provedores com ASN existem na UF. A linha e a cor indicam o PTT IX.br mais próximo — peering provável."
              : "Intensidade proporcional à métrica selecionada. Passe o mouse sobre uma UF para ver detalhes."}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={btnStyle(metric === "total", "#4F8EF7")} onClick={() => setMetric("total")}>Total</button>
          <button style={btnStyle(metric === "asn", "#3DD68C")} onClick={() => setMetric("asn")}>ASN × PTT</button>
          <button style={btnStyle(metric === "cdn", "#F7A84F")} onClick={() => setMetric("cdn")}>Potencial CDN</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: metric === "asn" ? "1fr 260px" : "1fr", gap: 16, alignItems: "start" }}>
        <div ref={ref} style={{ position: "relative", width: "100%" }}>
          {!geo && <div style={{ height: 360, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: 12 }}>Carregando mapa…</div>}
          {geo && path && (
            <svg width={w} height={h} style={{ display: "block" }}>
              {geo.features.map((f, i) => {
                const uf = ufOf(f);
                const v = uf ? values[uf] || 0 : 0;
                const dim = highlightPtt && uf && stats.ptt[uf]?.name !== highlightPtt ? 0.25 : 1;
                return (
                  <path key={i} d={path(f as any) || ""}
                    fill={uf ? colorFn(v) : "var(--bg3)"}
                    stroke="var(--border-c)" strokeWidth={0.6}
                    opacity={dim}
                    onMouseMove={e => {
                      if (!uf) return;
                      const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                      const pttInfo = stats.ptt[uf];
                      setHover({
                        x: e.clientX - rect.left + 12, y: e.clientY - rect.top + 12,
                        html: `<b>${UF_NAME[uf] || uf}</b><br/>
                          Total: ${stats.total[uf] || 0}<br/>
                          <span style="color:#3DD68C">Com ASN: ${stats.asn[uf] || 0}</span><br/>
                          <span style="color:#F7A84F">Potencial CDN: ${stats.naoCdn[uf] || 0}</span><br/>
                          Clientes Celeti: ${stats.ce[uf] || 0}<br/>
                          ${pttInfo ? `PTT + próximo: <b style="color:${pttColor(pttInfo.name)}">${pttInfo.name}</b> · ${pttInfo.km} km` : ""}`,
                      });
                    }}
                    onMouseLeave={() => setHover(null)}
                    style={{ cursor: "pointer", transition: "opacity .2s, fill .15s" }}
                  />
                );
              })}

              {/* Linhas UF → PTT mais próximo, coloridas por PTT */}
              {projection && metric === "asn" && Object.entries(stats.asn).map(([uf]) => {
                if (!UF_COORDS[uf] || !stats.ptt[uf]) return null;
                const ufC = projection([UF_COORDS[uf][1], UF_COORDS[uf][0]]);
                const pttInfo = stats.ptt[uf];
                const ptt = PTTS.find(p => p.name === pttInfo.name);
                if (!ptt || !ufC) return null;
                const pttC = projection([ptt.lon, ptt.lat]);
                if (!pttC) return null;
                const km = pttInfo.km;
                if (km < 30) return null;
                const c = pttColor(pttInfo.name);
                const dim = highlightPtt && pttInfo.name !== highlightPtt ? 0.1 : 0.7;
                return (
                  <line key={`l-${uf}`} x1={ufC[0]} y1={ufC[1]} x2={pttC[0]} y2={pttC[1]}
                    stroke={c} strokeWidth={1.4} strokeDasharray="4,3" opacity={dim}
                    style={{ pointerEvents: "none", transition: "opacity .2s" }} />
                );
              })}

              {/* Bolhas por UF com nº de ASNs, coloridas pelo PTT mais próximo */}
              {projection && metric === "asn" && Object.entries(stats.asn).map(([uf, count]) => {
                if (!UF_COORDS[uf]) return null;
                const c = projection([UF_COORDS[uf][1], UF_COORDS[uf][0]]);
                if (!c) return null;
                const r = Math.max(11, 6 + Math.sqrt(count) * 2);
                const pttInfo = stats.ptt[uf];
                const fill = pttInfo ? pttColor(pttInfo.name) : "#3DD68C";
                const dim = highlightPtt && pttInfo?.name !== highlightPtt ? 0.2 : 1;
                const fontSize = r > 18 ? 11 : r > 14 ? 10 : 9;
                return (
                  <g key={`b-${uf}`}
                    onMouseMove={e => {
                      const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                      setHover({
                        x: e.clientX - rect.left + 12, y: e.clientY - rect.top + 12,
                        html: `<b>${UF_NAME[uf] || uf}</b><br/>
                          <span style="color:#3DD68C">${count} provedores com ASN</span><br/>
                          ${pttInfo ? `→ <b style="color:${fill}">${pttInfo.name}</b> (${pttInfo.km} km)` : ""}`,
                      });
                    }}
                    onMouseLeave={() => setHover(null)}
                    style={{ cursor: "pointer", opacity: dim, transition: "opacity .2s" }}>
                    <circle cx={c[0]} cy={c[1]} r={r} fill={fill} fillOpacity={0.92} stroke="#0E1117" strokeWidth={1.5} />
                    <text x={c[0]} y={c[1] + fontSize / 3} textAnchor="middle"
                      fontSize={fontSize} fontWeight={700} fill="#0E1117"
                      style={{ fontFamily: "var(--font-head)", pointerEvents: "none" }}>
                      {count}
                    </text>
                  </g>
                );
              })}

              {/* PTTs IX.br destacados, com cor da paleta */}
              {projection && PTTS.filter(p => PTT_HIGHLIGHT.includes(p.name) || (metric === "asn" && stats.asnByPttSorted.find(s => s.name === p.name))).map(p => {
                const c = projection([p.lon, p.lat]);
                if (!c) return null;
                const fill = metric === "asn" ? pttColor(p.name) : "#F76F6F";
                const dim = highlightPtt && metric === "asn" && p.name !== highlightPtt ? 0.25 : 1;
                return (
                  <g key={p.name}
                    onMouseEnter={() => metric === "asn" && setHighlightPtt(p.name)}
                    onMouseMove={e => {
                      const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                      const total = stats.asnByPttSorted.find(s => s.name === p.name)?.count || 0;
                      setHover({ x: e.clientX - rect.left + 12, y: e.clientY - rect.top + 12,
                        html: `<b style="color:${fill}">${p.name}</b><br/>PTT IX.br${metric === "asn" ? `<br/>${total} ASNs prováveis` : ""}` });
                    }}
                    onMouseLeave={() => { setHover(null); if (metric === "asn") setHighlightPtt(null); }}
                    style={{ cursor: "pointer", opacity: dim, transition: "opacity .2s" }}>
                    <circle cx={c[0]} cy={c[1]} r={7} fill={fill} stroke="#fff" strokeWidth={2} />
                  </g>
                );
              })}
            </svg>
          )}
          {hover && (
            <div style={{
              position: "absolute", left: hover.x, top: hover.y, pointerEvents: "none",
              background: "var(--bg)", border: "1px solid var(--border-c)", borderRadius: 6,
              padding: "6px 10px", fontSize: 11, color: "var(--text)", zIndex: 5, lineHeight: 1.5, whiteSpace: "nowrap",
            }} dangerouslySetInnerHTML={{ __html: hover.html }} />
          )}
        </div>

        {/* Legenda lateral: ranking de ASNs por PTT */}
        {metric === "asn" && (
          <div style={{ background: "var(--bg)", border: "1px solid var(--border-c)", borderRadius: 6, padding: 12, fontSize: 11, maxHeight: h, overflowY: "auto" }}>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 11, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 10 }}>
              ASNs por PTT IX.br
            </div>
            <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 8 }}>
              Passe o mouse para destacar no mapa.
            </div>
            {stats.asnByPttSorted.length === 0 && (
              <div style={{ color: "var(--text3)", fontSize: 11 }}>Sem ASNs na visão atual.</div>
            )}
            {stats.asnByPttSorted.map(p => {
              const c = pttColor(p.name);
              const active = highlightPtt === p.name;
              return (
                <div key={p.name}
                  onMouseEnter={() => setHighlightPtt(p.name)}
                  onMouseLeave={() => setHighlightPtt(null)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "5px 6px",
                    borderRadius: 4, cursor: "pointer",
                    background: active ? "var(--bg3)" : "transparent",
                  }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: c, flexShrink: 0, border: "1.5px solid var(--bg)" }} />
                  <span style={{ flex: 1, color: "var(--text)", fontSize: 11 }}>{p.name}</span>
                  <b style={{ color: c, fontSize: 12 }}>{p.count}</b>
                </div>
              );
            })}
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border-c)", fontSize: 10, color: "var(--text3)", lineHeight: 1.55 }}>
              Atribuição feita pela <b>menor distância haversine</b> entre a UF e os PTTs IX.br — é uma aproximação do peering provável, não do AS-PATH real.
            </div>
          </div>
        )}
      </div>

      {/* Legenda inferior */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, fontSize: 11, color: "var(--text2)", flexWrap: "wrap" }}>
        <span>0</span>
        <div style={{ flex: 1, maxWidth: 240, height: 8, borderRadius: 4, background: `linear-gradient(to right, ${colorFn(0)}, ${colorFn(max)})` }} />
        <span>{max.toLocaleString("pt-BR")} {metric === "asn" ? "ASNs/UF" : "provedores/UF"}</span>
        {metric === "asn" && (
          <>
            <span style={{ marginLeft: 16, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#9CA3AF", border: "2px solid #fff" }} /> PTT IX.br
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 18, borderTop: "1.5px dashed #9CA3AF" }} /> ASN → PTT (cor do PTT)
            </span>
          </>
        )}
      </div>
    </div>
  );
}
