import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { endsIn, isExpired, km, money, pct, ppumLabel, timeAgo } from "./format";

describe("money", () => {
  it("CLP sin decimales y con punto de miles", () => {
    assert.equal(money(1090), "$1.090");
    assert.equal(money(1234567), "$1.234.567");
    assert.equal(money(990), "$990");
    assert.equal(money(0), "$0");
    assert.equal(money(12000), "$12.000");
    assert.equal(money(1000000), "$1.000.000");
  });
  it("redondea y no muestra decimales", () => {
    assert.equal(money(1089.6), "$1.090");
    assert.equal(money(1089.4), "$1.089");
  });
  it("negativos y valores no numéricos", () => {
    assert.equal(money(-500), "-$500");
    assert.equal(money(NaN), "—");
  });
});

describe("ppumLabel", () => {
  it("monto / unidad", () => {
    assert.equal(ppumLabel(1090, "L"), "$1.090 / L");
    assert.equal(ppumLabel(5990, "kg"), "$5.990 / kg");
    assert.equal(ppumLabel(1234.5, "100 g"), "$1.235 / 100 g");
  });
  it("sin unidad, solo el monto", () => {
    assert.equal(ppumLabel(1090, null), "$1.090");
    assert.equal(ppumLabel(1090, "  "), "$1.090");
  });
});

describe("pct", () => {
  it("descuento entero", () => {
    assert.equal(pct(1290, 1090), 16);
    assert.equal(pct(2000, 1000), 50);
  });
  it("0 sin rebaja", () => {
    assert.equal(pct(1000, 1000), 0);
    assert.equal(pct(1000, 1200), 0);
    assert.equal(pct(0, 100), 0);
  });
});

describe("km", () => {
  it("metros bajo 1 km, coma decimal hasta 10 km, enteros después", () => {
    assert.equal(km(0.85), "850 m");
    assert.equal(km(0.004), "10 m");
    assert.equal(km(2.34), "2,3 km");
    assert.equal(km(12.6), "13 km");
    assert.equal(km(-1), "");
  });
});

describe("timeAgo", () => {
  const now = Date.parse("2026-11-07T15:00:00Z");
  const ago = (seconds: number) => new Date(now - seconds * 1000).toISOString();
  it("segundos → un momento", () => {
    assert.equal(timeAgo(ago(0), now), "hace un momento");
    assert.equal(timeAgo(ago(59), now), "hace un momento");
  });
  it("minutos", () => {
    assert.equal(timeAgo(ago(60), now), "hace 1 min");
    assert.equal(timeAgo(ago(19 * 60), now), "hace 19 min");
    assert.equal(timeAgo(ago(59 * 60 + 59), now), "hace 59 min");
  });
  it("horas", () => {
    assert.equal(timeAgo(ago(3600), now), "hace 1 h");
    assert.equal(timeAgo(ago(2 * 3600 + 120), now), "hace 2 h");
    assert.equal(timeAgo(ago(23 * 3600), now), "hace 23 h");
  });
  it("días, meses y años", () => {
    assert.equal(timeAgo(ago(86400), now), "hace 1 día");
    assert.equal(timeAgo(ago(3 * 86400), now), "hace 3 días");
    assert.equal(timeAgo(ago(29 * 86400), now), "hace 29 días");
    assert.equal(timeAgo(ago(30 * 86400), now), "hace 1 mes");
    assert.equal(timeAgo(ago(75 * 86400), now), "hace 2 meses");
    assert.equal(timeAgo(ago(400 * 86400), now), "hace 1 año");
  });
  it("acepta Date como ahora", () => {
    assert.equal(timeAgo(ago(7200), new Date(now)), "hace 2 h");
  });
  it("un instante futuro (reloj adelantado) no rompe", () => {
    assert.equal(timeAgo(ago(-30), now), "hace un momento");
  });
  it("fecha ilegible", () => {
    assert.equal(timeAgo("no es una fecha", now), "sin fecha");
  });
});

describe("endsIn", () => {
  // Las ofertas terminan a las 23:59:59 hora de Chile (en noviembre rige UTC-3; el 7 de nov. son las 12:00 en Santiago).
  const now = Date.parse("2026-11-07T15:00:00Z");
  it("hoy", () => {
    assert.equal(endsIn("2026-11-08T02:59:59Z", now), "vence hoy");
  });
  it("mañana", () => {
    assert.equal(endsIn("2026-11-09T02:59:59Z", now), "vence mañana");
  });
  it("en N días", () => {
    assert.equal(endsIn("2026-11-13T02:59:59Z", now), "vence en 5 días"); // 12 nov, 23:59 en Santiago
    assert.equal(endsIn("2026-12-09T02:59:59Z", now), "vence en 31 días"); // 8 dic, 23:59 en Santiago
  });
  it("vencida → null", () => {
    assert.equal(endsIn("2026-11-06T02:59:59Z", now), null);
    assert.equal(endsIn("2026-11-07T14:00:00Z", now), null);
  });
  it("sin fecha o ilegible → null", () => {
    assert.equal(endsIn(null, now), null);
    assert.equal(endsIn(undefined, now), null);
    assert.equal(endsIn("", now), null);
    assert.equal(endsIn("xx", now), null);
  });
  it("cuenta el día en hora de Santiago aunque ya sea el día siguiente en UTC", () => {
    // 22:30 del sábado en Santiago = 01:30Z del domingo; la oferta del sábado termina en 1 h: "hoy"
    assert.equal(endsIn("2026-11-08T02:59:59Z", Date.parse("2026-11-08T01:30:00Z")), "vence hoy");
  });
});

describe("isExpired", () => {
  const now = Date.parse("2026-11-07T15:00:00Z");
  it("distingue vencida de vigente y de sin fecha", () => {
    assert.equal(isExpired("2026-11-06T02:59:59Z", now), true);
    assert.equal(isExpired("2026-11-08T02:59:59Z", now), false);
    assert.equal(isExpired(null, now), false);
    assert.equal(isExpired("xx", now), false);
  });
});
