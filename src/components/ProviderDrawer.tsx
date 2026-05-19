import { Provider, formatCNPJ, formatPhone, formatBRL } from "@/lib/providers";
import { providerScore, scoreColor, scoreBg, scoreLabel, abordagemRecomendada, emailStatusKind, toCsv, downloadCsv } from "@/lib/score";
import { nearestPTT } from "@/lib/ptt";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === "" || value === "—") return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "8px 0", borderBottom: "1px solid var(--border-c)" }}>
      <span style={{ color: "var(--text3)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
      <span style={{ color: "var(--text)", fontSize: 13, textAlign: "right", wordBreak: "break-word" }}>{value}</span>
    </div>
  );
}

function ProdBadge({ label, on }: { label: string; on: boolean }) {
  return (
    <span style={{
      display: "inline-block", fontSize: 10, padding: "3px 8px", borderRadius: 4, fontWeight: 600,
      background: on ? "var(--green-dim)" : "var(--bg3)",
      color: on ? "var(--green)" : "var(--text3)",
      marginRight: 6,
    }}>{label}: {on ? "Sim" : "Não"}</span>
  );
}

function emailStatusColor(kind: "valido" | "invalido" | "inconclusivo" | "sem") {
  if (kind === "valido") return { c: "var(--green)", bg: "var(--green-dim)", t: "Válido" };
  if (kind === "invalido") return { c: "var(--coral)", bg: "var(--coral-dim)", t: "Inválido" };
  if (kind === "inconclusivo") return { c: "var(--amber)", bg: "var(--amber-dim)", t: "Inconclusivo" };
  return { c: "var(--text3)", bg: "var(--bg3)", t: "Sem e-mail" };
}

export function ProviderDrawer({ p, onClose }: { p: Provider | null; onClose: () => void }) {
  if (!p) return null;
  const phones = [p.tel, p.tel2, p.tel3, p.tel4, p.tel5].map(formatPhone).filter(Boolean) as string[];
  const score = providerScore(p);
  const ptt = nearestPTT(p.uf);
  const recs = abordagemRecomendada(p);
  const ek = emailStatusColor(emailStatusKind(p.email_status));

  function copyContact() {
    const txt = [p.fantasia || p.nome, p.email, phones[0]].filter(Boolean).join(" · ");
    navigator.clipboard.writeText(txt);
  }
  function exportRow() {
    const csv = toCsv([p as unknown as Record<string, unknown>]);
    downloadCsv(`${(p.fantasia || p.nome || "provedor").replace(/[^\w]+/g, "_")}.csv`, csv);
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000 }} />
      <aside style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: "min(560px, 100vw)",
        background: "var(--bg2)", borderLeft: "1px solid var(--border-c)", zIndex: 1001,
        overflowY: "auto", padding: "24px 24px 80px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 14, gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>
              {p.fantasia || p.nome || "—"}
            </div>
            {p.fantasia && p.nome && p.fantasia !== p.nome && (
              <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>{p.nome}</div>
            )}
            <span style={{ display: "inline-block", marginTop: 8, fontSize: 10, padding: "3px 10px", borderRadius: 4, fontWeight: 700, background: scoreBg(score), color: scoreColor(score) }}>
              Score · {scoreLabel(score)}
            </span>
          </div>
          <button onClick={onClose} style={iconBtn}>✕</button>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          <button onClick={copyContact} style={actionBtn}>📋 Copiar contato</button>
          <button onClick={exportRow} style={actionBtn}>⬇ Exportar linha</button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <ProdBadge label="Celeti" on={p.celeti} />
          <ProdBadge label="Hub" on={p.hub} />
          <ProdBadge label="CDN" on={p.cdn} />
          <ProdBadge label="Rami" on={p.rami} />
        </div>

        <h3 style={sectionStyle}>Identificação</h3>
        <Row label="Razão social" value={p.nome} />
        <Row label="Nome fantasia" value={p.fantasia} />
        <Row label="CNPJ" value={formatCNPJ(p.cnpj)} />
        <Row label="Situação" value={p.situacao} />
        <Row label="Abertura" value={p.abertura} />
        <Row label="Capital Social" value={formatBRL(p.capital)} />
        <Row label="CNAE" value={p.cnae} />
        <Row label="Porte" value={p.porte} />
        <Row label="Faixa Faturamento" value={p.faixa} />
        <Row label="UF" value={p.uf} />
        <Row label="Município" value={p.municipio} />

        <h3 style={sectionStyle}>Contato</h3>
        <Row label="E-mail" value={p.email
          ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <a href={`mailto:${p.email}`} style={{ color: "var(--blue)" }}>{p.email}</a>
              <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: 600, background: ek.bg, color: ek.c }}>{ek.t}</span>
            </span>
          : <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: 600, background: ek.bg, color: ek.c }}>{ek.t}</span>} />
        {phones.map((t, i) => <Row key={i} label={`Telefone ${i + 1}`} value={t} />)}

        <h3 style={sectionStyle}>Técnico</h3>
        <Row label="ASN" value={p.asn ? `AS${p.asn}` : null} />
        <Row label="ERP" value={p.erp} />
        <Row label="Total de Assinantes" value={p.assinantes?.toLocaleString("pt-BR")} />
        <Row label="PTT mais próximo" value={ptt ? `${ptt.ptt} · ${ptt.km.toLocaleString("pt-BR")} km` : null} />

        <h3 style={sectionStyle}>Societário</h3>
        <Row label="Sócio" value={p.socio} />

        <h3 style={sectionStyle}>Recomendação de abordagem</h3>
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          {recs.map((r, i) => (
            <li key={i} style={{ fontSize: 12.5, color: "var(--text)", marginBottom: 8, lineHeight: 1.5 }}>{r}</li>
          ))}
        </ul>
      </aside>
    </>
  );
}

const sectionStyle: React.CSSProperties = {
  fontFamily: "var(--font-head)", fontSize: 12, fontWeight: 600, textTransform: "uppercase",
  letterSpacing: "0.08em", color: "var(--blue)", marginTop: 22, marginBottom: 8,
};
const actionBtn: React.CSSProperties = {
  background: "var(--bg3)", border: "1px solid var(--border-c)", color: "var(--text)",
  borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontFamily: "var(--font-body)",
};
const iconBtn: React.CSSProperties = {
  background: "transparent", border: "1px solid var(--border-c)", color: "var(--text2)",
  borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12,
};
