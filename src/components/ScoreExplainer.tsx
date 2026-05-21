import { useState } from "react";
import { Info, ChevronDown, ChevronUp } from "lucide-react";

export function ScoreExplainer() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: "var(--bg2)", border: "1px solid var(--border-c)",
      borderRadius: "var(--radius)", padding: "14px 18px", marginBottom: 16,
    }}>
      <button onClick={() => setOpen(!open)} style={{
        background: "transparent", border: "none", color: "var(--text)",
        cursor: "pointer", fontFamily: "var(--font-head)", fontSize: 13, fontWeight: 600,
        display: "flex", alignItems: "center", gap: 8, width: "100%", justifyContent: "space-between",
        padding: 0,
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Info size={14} style={{ color: "var(--blue)" }} />
          Como o Score de oportunidade é calculado
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && (
        <div style={{ marginTop: 14, fontSize: 12.5, color: "var(--text2)", lineHeight: 1.65 }}>
          <p style={{ marginBottom: 12 }}>
            O score classifica cada provedor em <b>Alto</b>, <b>Médio</b> ou <b>Baixo</b> potencial
            de conversão comercial, combinando porte, lacuna de produto, distância ao PTT e base de assinantes.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginTop: 8 }}>
            <Tier
              color="var(--coral)" bg="var(--coral-dim)" label="Alto"
              rule="Porte Médio ou Grande, ainda não-cliente de CDN ou Hub, e (distância ao PTT > 500 km OU > 500 assinantes)."
              why="Operação madura com dor técnica concreta (latência ou roteamento)."
            />
            <Tier
              color="var(--amber)" bg="var(--amber-dim)" label="Médio"
              rule="Porte Pequeno/Micro/ME, não-cliente em ≥ 2 produtos Supercomm, e e-mail marcado como válido."
              why="Lead acionável: contato confiável e múltiplas frentes de cross-sell."
            />
            <Tier
              color="var(--text3)" bg="var(--bg3)" label="Baixo"
              rule="Demais casos — já é cliente de várias linhas ou perfil sem gatilho claro."
              why="Mantém-se na base para relacionamento, sem prioridade de prospecção."
            />
          </div>

          <div style={{ marginTop: 14, padding: "10px 14px", background: "var(--bg3)", borderRadius: 6, fontSize: 11.5 }}>
            <b style={{ color: "var(--text)" }}>Sinais usados:</b> porte (Receita Federal),
            produtos contratados (Celeti, Hub, CDN, Rami), distância haversine entre UF e PTT IX.br mais próximo,
            total de assinantes e validade do e-mail. As recomendações de abordagem
            no painel lateral derivam dessas mesmas regras.
          </div>
        </div>
      )}
    </div>
  );
}

function Tier({ color, bg, label, rule, why }: { color: string; bg: string; label: string; rule: string; why: string }) {
  return (
    <div style={{ border: "1px solid var(--border-c)", borderRadius: 6, padding: 12 }}>
      <span style={{
        display: "inline-block", fontSize: 10, padding: "3px 10px", borderRadius: 4,
        fontWeight: 700, background: bg, color, marginBottom: 8,
      }}>Score · {label}</span>
      <div style={{ fontSize: 12, color: "var(--text)", marginBottom: 6 }}>{rule}</div>
      <div style={{ fontSize: 11, color: "var(--text3)", fontStyle: "italic" }}>{why}</div>
    </div>
  );
}
