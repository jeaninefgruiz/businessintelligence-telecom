import { useEffect, useMemo, useRef, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { scaleSequential } from "d3-scale";
import { Provider } from "@/lib/providers";
import { PTTS } from "@/lib/ptt";

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

export function BrazilMap({ providers }: { providers: Provider[] }) {
  const [geo, setGeo] = useState<FC | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number; html: string } | null>(null);
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
    const total: Record<string, number> = {}, ce: Record<string, number> = {}, naoCdn: Record<string, number> = {};
    providers.forEach(p => {
      if (!p.uf) return;
      total[p.uf] = (total[p.uf] || 0) + 1;
      if (p.celeti) ce[p.uf] = (ce[p.uf] || 0) + 1;
      if (!p.cdn) naoCdn[p.uf] = (naoCdn[p.uf] || 0) + 1;
    });
    return { total, ce, naoCdn };
  }, [providers]);

  const max = Math.max(1, ...Object.values(stats.total));
  // simple blue scale
  const color = scaleSequential<string>(t => {
    const a = 0.12 + t * 0.78;
    return `rgba(79,142,247,${a})`;
  }).domain([0, max]);

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

  return (
    <div style={{ background: "var(--bg2)", border: "1px solid var(--border-c)", borderRadius: "var(--radius)", padding: 20, marginBottom: 16 }}>
      <div style={{ fontFamily: "var(--font-head)", fontSize: 13, fontWeight: 600, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--blue)" }} />
        Mapa de provedores por UF · PTTs IX.br destacados
      </div>
      <p style={{ fontSize: 12, color: "var(--text2)", marginBottom: 14 }}>Intensidade proporcional ao nº de provedores na visão atual. Passe o mouse para detalhes.</p>
      <div ref={ref} style={{ position: "relative", width: "100%" }}>
        {!geo && <div style={{ height: 360, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: 12 }}>Carregando mapa…</div>}
        {geo && path && (
          <svg width={w} height={h} style={{ display: "block" }}>
            {geo.features.map((f, i) => {
              const uf = ufOf(f);
              const v = uf ? stats.total[uf] || 0 : 0;
              return (
                <path key={i} d={path(f as any) || ""}
                  fill={uf ? color(v) : "var(--bg3)"}
                  stroke="var(--border-c)" strokeWidth={0.6}
                  onMouseMove={e => {
                    if (!uf) return;
                    const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                    setHover({
                      x: e.clientX - rect.left + 12, y: e.clientY - rect.top + 12,
                      html: `<b>${UF_NAME[uf] || uf}</b><br/>${stats.total[uf] || 0} provedores<br/>Clientes Celeti: ${stats.ce[uf] || 0}<br/>Potencial CDN: ${stats.naoCdn[uf] || 0}`,
                    });
                  }}
                  onMouseLeave={() => setHover(null)}
                  style={{ cursor: "pointer", transition: "fill .15s" }}
                />
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
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, fontSize: 11, color: "var(--text2)" }}>
        <span>0</span>
        <div style={{ flex: 1, maxWidth: 240, height: 8, borderRadius: 4, background: "linear-gradient(to right, rgba(79,142,247,0.12), rgba(79,142,247,0.9))" }} />
        <span>{max.toLocaleString("pt-BR")}</span>
        <span style={{ marginLeft: 16, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#F76F6F", border: "1.5px solid #fff" }} /> PTT IX.br
        </span>
      </div>
    </div>
  );
}
