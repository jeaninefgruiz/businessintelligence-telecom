import { Provider, formatCNPJ, formatPhone, formatBRL } from "@/lib/providers";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === "" || value === "—") return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "8px 0", borderBottom: "1px solid var(--border-c)" }}>
      <span style={{ color: "var(--text3)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
      <span style={{ color: "var(--text)", fontSize: 13, textAlign: "right", wordBreak: "break-word" }}>{value}</span>
    </div>
  );
}

function Badge({ label, on }: { label: string; on: boolean }) {
  return (
    <span style={{
      display: "inline-block", fontSize: 10, padding: "3px 8px", borderRadius: 4, fontWeight: 600,
      background: on ? "var(--green-dim)" : "var(--bg3)",
      color: on ? "var(--green)" : "var(--text3)",
      marginRight: 6,
    }}>{label}: {on ? "Sim" : "Não"}</span>
  );
}

export function ProviderDrawer({ p, onClose }: { p: Provider | null; onClose: () => void }) {
  if (!p) return null;
  const phones = [p.tel, p.tel2, p.tel3, p.tel4, p.tel5].map(formatPhone).filter(Boolean);
  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000,
      }} />
      <aside style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: "min(520px, 100vw)",
        background: "var(--bg2)", borderLeft: "1px solid var(--border-c)", zIndex: 1001,
        overflowY: "auto", padding: "24px 24px 80px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>
              {p.fantasia || p.nome || "—"}
            </div>
            {p.fantasia && p.nome && p.fantasia !== p.nome && (
              <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>{p.nome}</div>
            )}
          </div>
          <button onClick={onClose} style={{
            background: "transparent", border: "1px solid var(--border-c)", color: "var(--text2)",
            borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12,
          }}>Fechar ✕</button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Badge label="Celeti" on={p.celeti} />
          <Badge label="Hub" on={p.hub} />
          <Badge label="CDN" on={p.cdn} />
          <Badge label="Rami" on={p.rami} />
        </div>

        <h3 style={sectionStyle}>Cadastro</h3>
        <Row label="CNPJ" value={formatCNPJ(p.cnpj)} />
        <Row label="Situação" value={p.situacao} />
        <Row label="Abertura" value={p.abertura} />
        <Row label="Porte" value={p.porte} />
        <Row label="Capital Social" value={formatBRL(p.capital)} />
        <Row label="Faixa Faturamento" value={p.faixa} />
        <Row label="CNAE Principal" value={p.cnae} />

        <h3 style={sectionStyle}>Localização</h3>
        <Row label="UF" value={p.uf} />
        <Row label="Município" value={p.municipio} />

        <h3 style={sectionStyle}>Técnico</h3>
        <Row label="ASN" value={p.asn ? `AS${p.asn}` : null} />
        <Row label="ERP" value={p.erp} />
        <Row label="Total de Assinantes" value={p.assinantes?.toLocaleString("pt-BR")} />

        <h3 style={sectionStyle}>Contato</h3>
        <Row label="Sócio" value={p.socio} />
        {phones.map((t, i) => <Row key={i} label={`Telefone ${i + 1}`} value={t} />)}
        <Row label="E-mail" value={p.email ? <a href={`mailto:${p.email}`} style={{ color: "var(--blue)" }}>{p.email}</a> : null} />
        <Row label="Status E-mail" value={p.email_status} />
      </aside>
    </>
  );
}

const sectionStyle: React.CSSProperties = {
  fontFamily: "var(--font-head)",
  fontSize: 12,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--blue)",
  marginTop: 22,
  marginBottom: 8,
};
