// PTTs IX.br (principais)
export const PTTS: { name: string; lat: number; lon: number }[] = [
  { name: "IX.br SP",  lat: -23.55, lon: -46.63 },
  { name: "IX.br RJ",  lat: -22.90, lon: -43.17 },
  { name: "IX.br FOR", lat: -3.72,  lon: -38.54 },
  { name: "IX.br POA", lat: -30.03, lon: -51.23 },
  { name: "IX.br BSB", lat: -15.77, lon: -47.93 },
  { name: "IX.br BEL", lat: -1.46,  lon: -48.50 },
  { name: "IX.br MAN", lat: -3.10,  lon: -60.02 },
  { name: "IX.br SAL", lat: -12.97, lon: -38.50 },
  { name: "IX.br REC", lat: -8.05,  lon: -34.88 },
  { name: "IX.br CWB", lat: -25.43, lon: -49.27 },
  { name: "IX.br BH",  lat: -19.92, lon: -43.94 },
  { name: "IX.br VIX", lat: -20.32, lon: -40.34 },
  { name: "IX.br CGB", lat: -15.60, lon: -56.10 },
  { name: "IX.br GYN", lat: -16.69, lon: -49.26 },
  { name: "IX.br FLN", lat: -27.59, lon: -48.55 },
  { name: "IX.br NAT", lat: -5.79,  lon: -35.21 },
  { name: "IX.br JPA", lat: -7.12,  lon: -34.86 },
  { name: "IX.br MCZ", lat: -9.65,  lon: -35.73 },
  { name: "IX.br SLZ", lat: -2.53,  lon: -44.30 },
  { name: "IX.br TER", lat: -5.09,  lon: -42.81 },
  { name: "IX.br ARU", lat: -21.21, lon: -41.66 },
  { name: "IX.br CGR", lat: -20.46, lon: -54.62 },
  { name: "IX.br LDB", lat: -23.31, lon: -51.16 },
  { name: "IX.br MGF", lat: -23.43, lon: -51.94 },
];

// Coordenadas aproximadas (capitais e cidades-referência por UF)
export const UF_COORDS: Record<string, [number, number]> = {
  AC: [-9.97, -67.81],   AL: [-9.65, -35.73],   AP: [0.03, -51.06],
  AM: [-3.10, -60.02],   BA: [-12.97, -38.50],  CE: [-3.72, -38.54],
  DF: [-15.77, -47.93],  ES: [-20.32, -40.34],  GO: [-16.69, -49.26],
  MA: [-2.53, -44.30],   MT: [-15.60, -56.10],  MS: [-20.46, -54.62],
  MG: [-19.92, -43.94],  PA: [-1.46, -48.50],   PB: [-7.12, -34.86],
  PR: [-25.43, -49.27],  PE: [-8.05, -34.88],   PI: [-5.09, -42.81],
  RJ: [-22.90, -43.17],  RN: [-5.79, -35.21],   RS: [-30.03, -51.23],
  RO: [-8.76, -63.90],   RR: [2.82, -60.67],    SC: [-27.59, -48.55],
  SP: [-23.55, -46.63],  SE: [-10.91, -37.07],  TO: [-10.18, -48.33],
};

const R = 6371;
function toRad(d: number) { return (d * Math.PI) / 180; }
export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function nearestPTT(uf: string | null): { ptt: string; km: number } | null {
  if (!uf || !UF_COORDS[uf]) return null;
  const [lat, lon] = UF_COORDS[uf];
  let best = PTTS[0], bestKm = Infinity;
  for (const p of PTTS) {
    const km = haversine(lat, lon, p.lat, p.lon);
    if (km < bestKm) { bestKm = km; best = p; }
  }
  return { ptt: best.name, km: Math.round(bestKm) };
}

export type CdnPriority = "alta" | "media" | "baixa";
export function cdnPriority(km: number): CdnPriority {
  if (km > 1000) return "alta";
  if (km > 500) return "media";
  return "baixa";
}
