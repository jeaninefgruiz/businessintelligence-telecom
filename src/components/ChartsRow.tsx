import { useMemo } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale,
  Tooltip, Legend, Title,
} from "chart.js";
import { Provider } from "@/lib/providers";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

const GRID = { color: "rgba(38,48,73,0.7)" };
const TICK = { color: "#8B9BBF", font: { size: 10, family: "'DM Sans', sans-serif" } };

export function ChartsRow({ providers }: { providers: Provider[] }) {
  const ufData = useMemo(() => {
    const c: Record<string, number> = {};
    providers.forEach(p => { if (p.uf) c[p.uf] = (c[p.uf] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 15);
  }, [providers]);

  const porteData = useMemo(() => {
    const c: Record<string, number> = {};
    providers.forEach(p => { const k = p.porte || "—"; c[k] = (c[k] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [providers]);

  const erpData = useMemo(() => {
    const c: Record<string, number> = {};
    providers.forEach(p => { if (p.erp) c[p.erp] = (c[p.erp] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [providers]);

  const prodData = useMemo(() => {
    let ce = 0, hu = 0, cd = 0, ra = 0;
    providers.forEach(p => { if (p.celeti) ce++; if (p.hub) hu++; if (p.cdn) cd++; if (p.rami) ra++; });
    return { ce, hu, cd, ra, total: providers.length };
  }, [providers]);

  const donutColors = ["#4F8EF7", "#3DD68C", "#F7A84F", "#F76F6F", "#4FD6D6", "#8B5CF6", "#F7C94F", "#64B5F6", "#A5D6A7", "#FFB74D"];

  return (
    <>
      <div className="row2">
        <Card title="Provedores por UF (top 15)" dot="var(--blue)">
          <div style={{ height: 240 }}>
            <Bar
              data={{
                labels: ufData.map(e => e[0]),
                datasets: [{ data: ufData.map(e => e[1]), backgroundColor: "rgba(79,142,247,0.7)", borderColor: "#4F8EF7", borderWidth: 1, borderRadius: 3 }],
              }}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: GRID, ticks: TICK }, y: { grid: GRID, ticks: TICK } } }}
            />
          </div>
        </Card>
        <Card title="Porte das empresas" dot="var(--teal)">
          <div style={{ height: 240 }}>
            <Doughnut
              data={{ labels: porteData.map(e => e[0]), datasets: [{ data: porteData.map(e => e[1]), backgroundColor: donutColors, borderWidth: 2, borderColor: "#151B26" }] }}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "right", labels: { color: "#8B9BBF", font: { size: 10 }, boxWidth: 10 } } }, cutout: "60%" }}
            />
          </div>
        </Card>
      </div>

      <div className="row2">
        <Card title="Market share de ERP (top 10)" dot="var(--amber)">
          <div style={{ height: 240 }}>
            <Doughnut
              data={{ labels: erpData.map(e => `${e[0]} (${e[1]})`), datasets: [{ data: erpData.map(e => e[1]), backgroundColor: donutColors, borderWidth: 2, borderColor: "#151B26" }] }}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "right", labels: { color: "#8B9BBF", font: { size: 10 }, boxWidth: 10 } } }, cutout: "55%" }}
            />
          </div>
        </Card>
        <Card title="Clientes por produto Supercomm" dot="var(--green)">
          <div style={{ height: 240 }}>
            <Bar
              data={{
                labels: ["Celeti", "Celeti Hub", "CDN", "Rami"],
                datasets: [
                  { label: "Clientes", data: [prodData.ce, prodData.hu, prodData.cd, prodData.ra], backgroundColor: "rgba(79,142,247,0.85)", borderRadius: 3 },
                  { label: "Não clientes", data: [prodData.total - prodData.ce, prodData.total - prodData.hu, prodData.total - prodData.cd, prodData.total - prodData.ra], backgroundColor: "rgba(38,48,73,0.8)", borderRadius: 3 },
                ],
              }}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: "#8B9BBF", font: { size: 11 }, boxWidth: 10 } } }, scales: { x: { stacked: true, grid: GRID, ticks: TICK }, y: { stacked: true, grid: GRID, ticks: TICK } } }}
            />
          </div>
        </Card>
      </div>
    </>
  );
}

function Card({ title, dot, children }: { title: string; dot: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--bg2)", border: "1px solid var(--border-c)", borderRadius: "var(--radius)", padding: 20 }}>
      <div style={{ fontFamily: "var(--font-head)", fontSize: 13, fontWeight: 600, letterSpacing: "0.03em", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot }} />
        {title}
      </div>
      {children}
    </div>
  );
}
