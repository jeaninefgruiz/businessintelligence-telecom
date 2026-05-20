import { useEffect, useMemo, useRef, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { scaleSequential } from "d3-scale";
import { Provider } from "@/lib/providers";
import { PTTS, UF_COORDS, nearestPTT } from "@/lib/ptt";

type Feature = {
  type: "Feature";
  properties: { sigla?: string; name?: string; SIGLA_UF?: string; NM_UF?: string };
  geometry: any;
};
type FC = { type: "FeatureCollection"; features: Feature[] };

const PTT_HIGHLIGHT = ["IX.br SP", "IX.br RJ", "IX.br FOR", "IX.br POA", "IX.br BSB", "IX.br BEL", "IX.br MAN", "IX.br SAL", "IX.br REC", "IX.br CWB"];

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
    // PTT info per UF
    const ptt: Record<string, { name: string; km: number }> = {};
    Object.keys(UF_COORDS).forEach(uf => {
      const n = nearestPTT(uf);
      if (n) ptt[uf] = { name: n.ptt, km: n.km };
    });
    return { total, ce, naoCdn, asn, ptt };
  }, [providers]);

  const values = metric === "asn" ? stats.asn : metric === "cdn" ? stats.naoCdn : stats.total;
  const max = Math.max(1, ...Object.values(values));

  const colorFn = (v: number) => {
    const t = v / max;
    const a = 0.12 + t * 0.78;
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

  const metricLabel = metric === "asn" ? "Provedores com ASN" : metric === "cdn" ? "Potencial CDN (sem CDN)" : "Total de provedores";
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
            {metricLabel} · PTTs IX.br destacados
          </div>
          <p style={{ fontSize: 12, color: "var(--text2)", marginTop: 6 }}>
            Intensidade proporcional à métrica selecionada. Passe o mouse sobre uma UF para ver provedores com ASN e distância ao PTT mais próximo.
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={btnStyle(metric === "total", "#4F8EF7")} onClick={() => setMetric("total")}>Total</button>
          <button style={btnStyle(metric === "asn", "#3DD68C")} onClick={() => setMetric("asn")}>Com ASN</button>
          <button style={btnStyle(metric === "cdn", "#F7A84F")} onClick={() => setMetric("cdn")}>Potencial CDN</button>
        </div>
      </div>
      <div ref={ref} style={{ position: "relative", width: "100%" }}>
        {!geo && <div style={{ height: 360, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: 12 }}>Carregando mapa…</div>}
        {geo && path && (
          <svg width={w} height={h} style={{ display: "block" }}>
            {geo.features.map((f, i) => {
              const uf = ufOf(f);
              const v = uf ? values[uf] || 0 : 0;
              return (
                <path key={i} d={path(f as any) || ""}
                  fill={uf ? colorFn(v) : "var(--bg3)"}
                  stroke="var(--border-c)" strokeWidth={0.6}
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
                        ${pttInfo ? `PTT + próximo: <b>${pttInfo.name}</b> · ${pttInfo.km} km` : ""}`,
                    });
                  }}
                  onMouseLeave={() => setHover(null)}
                  style={{ cursor: "pointer", transition: "fill .15s" }}
                />
              );
            })}
            {/* Linhas + label km de cada UF (com ASN) até o PTT mais próximo */}
            {projection && metric === "asn" && Object.entries(stats.asn).map(([uf]) => {
              if (!UF_COORDS[uf] || !stats.ptt[uf]) return null;
              const ufC = projection([UF_COORDS[uf][1], UF_COORDS[uf][0]]);
              const ptt = PTTS.find(p => p.name === stats.ptt[uf].name);
              if (!ptt || !ufC) return null;
              const pttC = projection([ptt.lon, ptt.lat]);
              if (!pttC) return null;
              const km = stats.ptt[uf].km;
              if (km < 30) return null;
              const mx = (ufC[0] + pttC[0]) / 2, my = (ufC[1] + pttC[1]) / 2;
              return (
                <g key={`l-${uf}`} style={{ pointerEvents: "none" }}>
                  <line x1={ufC[0]} y1={ufC[1]} x2={pttC[0]} y2={pttC[1]}
                    stroke="#3DD68C" strokeWidth={1.2} strokeDasharray="4,3" opacity={0.6} />
                  {km >= 200 && (
                    <>
                      <rect x={mx - 22} y={my - 8} width={44} height={14} rx={3}
                        fill="var(--bg)" stroke="#3DD68C" strokeWidth={0.8} opacity={0.95} />
                      <text x={mx} y={my + 2} textAnchor="middle" fontSize={9} fontWeight={600}
                        fill="#3DD68C" style={{ fontFamily: "var(--font-body)" }}>
                        {km} km
                      </text>
                    </>
                  )}
                </g>
              );
            })}
            {/* Bolhas por UF com nº de ASNs dentro */}
            {projection && metric === "asn" && Object.entries(stats.asn).map(([uf, count]) => {
              if (!UF_COORDS[uf]) return null;
              const c = projection([UF_COORDS[uf][1], UF_COORDS[uf][0]]);
              if (!c) return null;
              const r = Math.max(11, 6 + Math.sqrt(count) * 2);
              const pttInfo = stats.ptt[uf];
              const fontSize = r > 18 ? 11 : r > 14 ? 10 : 9;
              return (
                <g key={`b-${uf}`}
                  onMouseMove={e => {
                    const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                    setHover({
                      x: e.clientX - rect.left + 12, y: e.clientY - rect.top + 12,
                      html: `<b>${UF_NAME[uf] || uf}</b><br/>
                        <span style="color:#3DD68C">${count} provedores com ASN</span><br/>
                        ${pttInfo ? `→ ${pttInfo.name} (${pttInfo.km} km)` : ""}`,
                    });
                  }}
                  onMouseLeave={() => setHover(null)}
                  style={{ cursor: "pointer" }}>
                  <circle cx={c[0]} cy={c[1]} r={r} fill="#3DD68C" fillOpacity={0.95} stroke="#0E1117" strokeWidth={1.5} />
                  <text x={c[0]} y={c[1] + fontSize / 3} textAnchor="middle"
                    fontSize={fontSize} fontWeight={700} fill="#0E1117"
                    style={{ fontFamily: "var(--font-head)", pointerEvents: "none" }}>
                    {count}
                  </text>
                </g>
              );
            })}
            {projection && PTTS.filter(p => PTT_HIGHLIGHT.includes(p.name)).map(p => {
              const c = projection([p.lon, p.lat]);
              if (!c) return null;
              return (
                <g key={p.name}
                  onMouseMove={e => {
                    const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                    setHover({ x: e.clientX - rect.left + 12, y: e.clientY - rect.top + 12, html: `<b>${p.name}</b><br/>PTT IX.br` });
                  }}
                  onMouseLeave={() => setHover(null)}
                  style={{ cursor: "pointer" }}>
                  <circle cx={c[0]} cy={c[1]} r={5} fill="#F76F6F" stroke="#fff" strokeWidth={1.5} />
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
      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, fontSize: 11, color: "var(--text2)", flexWrap: "wrap" }}>
        <span>0</span>
        <div style={{ flex: 1, maxWidth: 240, height: 8, borderRadius: 4, background: `linear-gradient(to right, ${colorFn(0)}, ${colorFn(max)})` }} />
        <span>{max.toLocaleString("pt-BR")}</span>
        <span style={{ marginLeft: 16, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#F76F6F", border: "1.5px solid #fff" }} /> PTT IX.br
        </span>
        {metric === "asn" && (
          <>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3DD68C", opacity: 0.65, border: "1px solid #fff" }} /> Bolha = nº de ASNs
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 18, borderTop: "1px dashed #3DD68C" }} /> Distância ao PTT
            </span>
          </>
        )}
      </div>
    </div>
  );
}
