export type Provider = {
  cnpj: string | null;
  nome: string | null;
  fantasia: string | null;
  celeti: boolean;
  hub: boolean;
  cdn: boolean;
  rami: boolean;
  asn: number | null;
  erp: string | null;
  assinantes: number | null;
  uf: string | null;
  municipio: string | null;
  porte: string | null;
  situacao: string | null;
  abertura: string | null;
  capital: number | null;
  cnae: string | null;
  socio: string | null;
  tel: string | null;
  email: string | null;
  email_status: string | null;
  tel2: string | null;
  tel3: string | null;
  tel4: string | null;
  tel5: string | null;
  faixa: string | null;
};

import { supabase } from "@/integrations/supabase/client";

let cache: Provider[] | null = null;

const PAGE = 1000;

export async function loadProviders(): Promise<Provider[]> {
  if (cache) return cache;
  const all: Provider[] = [];
  let from = 0;
  // Paginação para superar o limite padrão de 1000 linhas do PostgREST
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase
      .from("base_isp_outorgados")
      .select("*")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    all.push(...(data as unknown as Provider[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  cache = all;
  return cache;
}

export function formatPhone(v: string | null | undefined): string | null {
  if (!v) return null;
  const s = String(v).replace(/\D/g, "").replace(/\.0$/, "");
  if (!s) return null;
  if (s.length === 11) return `(${s.slice(0, 2)}) ${s.slice(2, 7)}-${s.slice(7)}`;
  if (s.length === 10) return `(${s.slice(0, 2)}) ${s.slice(2, 6)}-${s.slice(6)}`;
  return s;
}

export function formatCNPJ(v: string | null | undefined): string {
  if (!v) return "—";
  const s = String(v).padStart(14, "0");
  return `${s.slice(0, 2)}.${s.slice(2, 5)}.${s.slice(5, 8)}/${s.slice(8, 12)}-${s.slice(12)}`;
}

export function formatBRL(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}
