import type { RegionDTO } from '../../types/api';

/** Una comuna lista para elegir: con su región al lado, que es lo que la distingue de otra del mismo nombre. */
export type CommuneMatch = {
  name: string;
  /** Lo que la API recibe en `?comuna=`: «region-slug|Comuna». */
  value: string;
  lat: number;
  lng: number;
  region: string;
  regionSlug: string;
  /** «Ñuñoa, Metropolitana de Santiago»: cómo se nombra la ubicación en pantalla. */
  place: string;
};

/** Minúsculas, sin tildes ni diéresis y sin espacios de más: «Ñuñoa» → «nunoa», «Maipú» → «maipu». */
export function normalizeText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** «Ñuñoa» + «Metropolitana de Santiago» → «Ñuñoa, Metropolitana de Santiago». */
export function communePlace(name: string, region: string): string {
  return `${name}, ${region}`;
}

type Entry = { match: CommuneMatch; name: string; region: string };
// `region` (normalizada) solo desempata: escribir «santiago» no debe traer las 52 comunas de la región Metropolitana

function rank(e: Entry, q: string): number {
  if (e.name.startsWith(q)) return 0; // «ñu» → Ñuñoa
  if (e.name.split(' ').some((w) => w.startsWith(q))) return 1; // «alto» → Puente Alto
  if (e.name.includes(q)) return 2;
  return -1;
}

/**
 * Comunas que calzan con lo escrito, sin importar tildes ni mayúsculas. Primero las que empiezan con el texto,
 * luego las que tienen una palabra que empieza así y luego las que lo contienen. Solo se busca por el nombre de la
 * comuna (la región se muestra al lado, no se usa para buscar). Sin texto, todas en orden alfabético.
 */
export function filterCommunes(
  regions: RegionDTO[],
  query: string,
): CommuneMatch[] {
  const q = normalizeText(query);
  const entries: Entry[] = [];
  for (const region of regions) {
    const regionNorm = normalizeText(region.name);
    for (const c of region.communes) {
      entries.push({
        name: normalizeText(c.name),
        region: regionNorm,
        match: {
          name: c.name,
          value: c.value,
          lat: c.lat,
          lng: c.lng,
          region: region.name,
          regionSlug: region.slug,
          place: communePlace(c.name, region.name),
        },
      });
    }
  }
  const scored = q
    ? entries.map((e) => ({ e, r: rank(e, q) })).filter((x) => x.r >= 0)
    : entries.map((e) => ({ e, r: 0 }));
  scored.sort(
    (a, b) =>
      a.r - b.r ||
      (a.e.name < b.e.name ? -1 : a.e.name > b.e.name ? 1 : 0) ||
      (a.e.region < b.e.region ? -1 : a.e.region > b.e.region ? 1 : 0),
  );
  return scored.map((x) => x.e.match);
}
