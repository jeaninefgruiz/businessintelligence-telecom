import { Provider } from "./providers";
import { nearestPTT } from "./ptt";

export type Score = "alto" | "medio" | "baixo";

// "Maior porte" inclui também DEMAIS (categoria da Receita p/ empresas fora do Simples — normalmente maiores)
const PORTE_MG = /m[eé]dio|grande|demais/i;
const PORTE_P = /pequeno|micro|me$|mei/i;

export function providerScore(p: Provider): Score {
  const km = nearestPTT(p.uf)?.km ?? 0;
  const ass = p.assinantes ?? 0;
  const naoCdn = !p.cdn, naoHub = !p.hub;
  const porte = p.porte || "";
  const emailOk = (p.email_status || "").toLowerCase().startsWith("v");
  const naoClienteCount = (p.celeti ? 0 : 1) + (p.hub ? 0 : 1) + (p.cdn ? 0 : 1) + (p.rami ? 0 : 1);

  // ALTO: porte maior + lacuna de produto + (longe do PTT OU base relevante de assinantes)
  if (PORTE_MG.test(porte) && (naoCdn || naoHub) && (km > 500 || ass > 500)) return "alto";
  // ALTO alternativo: muitos assinantes (>2k) sem CDN, mesmo sendo pequeno
  if (ass > 2000 && naoCdn) return "alto";

  // MÉDIO: pequeno/micro com lacuna em ≥2 produtos e e-mail válido (abordável)
  if (PORTE_P.test(porte) && naoClienteCount >= 2 && emailOk) return "medio";
  // MÉDIO alternativo: qualquer porte sem CDN, com ≥200 assinantes e e-mail válido
  if (naoCdn && ass >= 200 && emailOk) return "medio";

  return "baixo";
}

export function scoreColor(s: Score): string {
  if (s === "alto") return "var(--coral)";
  if (s === "medio") return "var(--amber)";
  return "var(--text3)";
}
export function scoreBg(s: Score): string {
  if (s === "alto") return "var(--coral-dim)";
  if (s === "medio") return "var(--amber-dim)";
  return "var(--bg3)";
}
export function scoreLabel(s: Score): string {
  return s === "alto" ? "Alto" : s === "medio" ? "Médio" : "Baixo";
}

export function abordagemRecomendada(p: Provider): string[] {
  const tips: string[] = [];
  const km = nearestPTT(p.uf)?.km ?? 0;
  const ass = p.assinantes ?? 0;
  const porte = p.porte || "";
  if (!p.cdn && km > 800) {
    tips.push(`Forte candidato a CDN — ${km} km até o PTT IX.br mais próximo impacta latência dos usuários finais. Abordagem técnica recomendada.`);
  }
  if (!p.hub && ass > 500) {
    tips.push(`Porte operacional (${ass.toLocaleString("pt-BR")} assinantes) compatível com Celeti Hub. Explorar centralização de roteamento.`);
  }
  if (!p.rami && PORTE_MG.test(porte)) {
    tips.push(`Perfil financeiro (porte ${porte}) adequado para Rami Capital. Verificar necessidade de crédito para expansão.`);
  }
  if (!p.celeti && (p.hub || p.cdn || p.rami)) {
    tips.push(`Já é cliente Supercomm em outro produto — oportunidade de cross-sell para Celeti (ERP).`);
  }
  if (!tips.length) tips.push("Sem gatilho automático evidente. Avaliar manualmente porte, ERP e maturidade do provedor.");
  return tips;
}

export function maturidadeAnos(abertura: string | null): number | null {
  if (!abertura) return null;
  const m = String(abertura).match(/(\d{4})-(\d{1,2})-(\d{1,2})/) || String(abertura).match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (!m) return null;
  const y = m[1].length === 4 ? +m[1] : +m[3];
  if (!y || y < 1900) return null;
  return new Date().getFullYear() - y;
}
export function maturidadeFaixa(a: number | null): string {
  if (a == null) return "—";
  if (a < 2) return "< 2 anos";
  if (a < 5) return "2–5 anos";
  if (a < 10) return "5–10 anos";
  return "> 10 anos";
}

export function assinantesFaixa(a: number | null): string {
  if (a == null) return "—";
  if (a < 100) return "< 100";
  if (a < 500) return "100–500";
  if (a < 2000) return "500–2.000";
  return "> 2.000";
}

export function emailStatusKind(s: string | null | undefined): "valido" | "invalido" | "inconclusivo" | "sem" {
  if (!s) return "sem";
  const v = s.toLowerCase();
  if (v.includes("v") && !v.includes("inv")) return "valido";
  if (v.includes("inv")) return "invalido";
  return "inconclusivo";
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    if (v == null) return "";
    const s = String(v).replace(/"/g, '""');
    return /[",\n;]/.test(s) ? `"${s}"` : s;
  };
  return [headers.join(";"), ...rows.map(r => headers.map(h => esc(r[h])).join(";"))].join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
