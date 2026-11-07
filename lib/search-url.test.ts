import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { activeFilterCount, isUnfiltered, parseSearchParams, toRouteParams, toRouteParamsPatch } from "./search-url";

describe("parseSearchParams", () => {
  it("lee los seis parámetros", () => {
    assert.deepEqual(
      parseSearchParams({ q: "leche", category: "lacteos", subcategory: "leches", chain: "jumbo", offers: "1", sort: "barato" }),
      { q: "leche", category: "lacteos", subcategory: "leches", chain: "jumbo", offers: true, sort: "barato" },
    );
  });

  it("sin parámetros no hay filtros", () => {
    assert.deepEqual(parseSearchParams({}), {
      q: undefined, category: undefined, subcategory: undefined, chain: undefined, offers: undefined, sort: undefined,
    });
  });

  it("ignora un orden desconocido y trata `relevancia` como el orden por defecto", () => {
    assert.equal(parseSearchParams({ sort: "caro" }).sort, undefined);
    assert.equal(parseSearchParams({ sort: "relevancia" }).sort, undefined);
  });

  it("toma el primero si el parámetro viene repetido y corta el texto en 80", () => {
    assert.equal(parseSearchParams({ chain: ["lider", "jumbo"] }).chain, "lider");
    assert.equal(parseSearchParams({ q: "x".repeat(200) }).q?.length, 80);
  });

  it("offers acepta 1 y true, nada más", () => {
    assert.equal(parseSearchParams({ offers: "true" }).offers, true);
    assert.equal(parseSearchParams({ offers: "0" }).offers, undefined);
  });
});

describe("toRouteParams / conteo", () => {
  it("ida y vuelta", () => {
    const f = { q: "arroz", chain: "lider", offers: true, sort: "ahorro" as const };
    assert.deepEqual(parseSearchParams(toRouteParams(f)), { ...f, category: undefined, subcategory: undefined });
  });

  it("no emite lo vacío", () => {
    assert.deepEqual(toRouteParams({ q: "  ", chain: "", offers: false, sort: "relevancia" }), {});
  });

  it("el parche lleva los seis parámetros, con undefined para quitar los ausentes", () => {
    assert.deepEqual(toRouteParamsPatch({ q: "leche", offers: true }), {
      q: "leche", category: undefined, subcategory: undefined, chain: undefined, offers: "1", sort: undefined,
    });
    assert.deepEqual(Object.keys(toRouteParamsPatch({})).sort(), ["category", "chain", "offers", "q", "sort", "subcategory"]);
  });

  it("cuenta solo los filtros, no el texto ni el orden", () => {
    assert.equal(activeFilterCount({ q: "a", sort: "barato" }), 0);
    assert.equal(activeFilterCount({ category: "x", chain: "y", offers: true }), 3);
    assert.equal(isUnfiltered({ sort: "barato" }), true);
    assert.equal(isUnfiltered({ q: "a" }), false);
  });
});
