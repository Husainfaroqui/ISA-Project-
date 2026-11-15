import { describe, it, expect } from "vitest";
import { computeMode } from "../src/lib/supabase";
import { roleFromClaims, availableActions } from "../src/lib/admin";
import { dbNorm, withOfflineFallback } from "../src/lib/repo";
import { parseForm, formHtml, type Field } from "../src/lib/forms";
import { errorHtml } from "../src/pages/states";
import { createLocalRepo } from "../src/lib/local";
describe("public data modes", () => {
  it("uses Supabase when configured and the local research archive otherwise", () => { expect(computeMode(true)).toBe("live"); expect(computeMode(false)).toBe("local"); });
  it("error states never contain data and escape messages", () => {
    expect(errorHtml("en", { kind: "unconfigured", message: "" })).toContain("not configured"); expect(errorHtml("en", { kind: "notfound", message: "" })).toContain("404");
    expect(errorHtml("en", { kind: "error", message: "<img onerror=x>" }, true)).not.toContain("<img"); expect(errorHtml("en", { kind: "error", message: "x" }, true)).toContain("data-retry"); expect(errorHtml("ar", { kind: "unconfigured", message: "" })).toContain("لم يتم");
  });
});
describe("local fallback when Supabase is unreachable", () => {
  it("uses bundled archive content for network failures and preserves non-network errors", async () => {
    const fallback = async () => ({ ok: true as const, data: "local archive" });
    expect(await withOfflineFallback(async () => ({ ok: false as const, kind: "error" as const, message: "Failed to fetch" }), fallback)).toEqual({ ok: true, data: "local archive" });
    expect(await withOfflineFallback(async () => { throw new TypeError("Load failed"); }, fallback)).toEqual({ ok: true, data: "local archive" });
    expect(await withOfflineFallback(async () => ({ ok: false as const, kind: "error" as const, message: "permission denied" }), fallback)).toMatchObject({ ok: false, message: "permission denied" });
  });
});
describe("roles and actions (UX mirror of the database rules)", () => {
  it("role comes only from app_metadata.role", () => { expect(roleFromClaims({ role: "admin" })).toBe("admin"); expect(roleFromClaims({ role: "editor" })).toBe("editor"); expect(roleFromClaims({ role: "superuser" })).toBeNull(); expect(roleFromClaims(undefined)).toBeNull(); expect(roleFromClaims(null)).toBeNull(); });
  it("actions per status and role", () => {
    expect(availableActions("draft", "editor")).toEqual(["submit"]); expect(availableActions("draft", "admin")).toEqual(["submit", "delete"]);
    expect(availableActions("in_review", "editor")).toEqual(["return_draft", "review", "publish"]); expect(availableActions("published", "editor")).toEqual(["unpublish"]); expect(availableActions("published", "admin")).toEqual(["unpublish", "archive"]);
    expect(availableActions("archived", "editor")).toEqual([]); expect(availableActions("archived", "admin")).toEqual(["restore"]);
  });
});
describe("search normalisation matches the database", () => { it("folds Arabic yeh/alef/kaf, strips marks, lowercases", () => { expect(dbNorm("  KINDI ")).toBe("kindi"); expect(dbNorm("سينا")).toBe(dbNorm("سینا")); expect(dbNorm("موسى")).toBe("موسی"); expect(dbNorm("أحمد")).toBe("احمد"); expect(dbNorm("كتاب")).toBe("کتاب"); expect(dbNorm("موسیٰ")).toBe("موسی"); }); });
describe("admin forms", () => {
  const F: Field[] = [{ name: "title", label: "Title", type: "text", required: true }, { name: "year", label: "Year", type: "number" }, { name: "alt", label: "Alt", type: "csv" }, { name: "kind", label: "Kind", type: "select", options: [["a", "A"]] }];
  it("parses, validates and nulls empties", () => {
    expect(parseForm(F, n => ({ title: " T ", year: "1856", alt: "a, b ,,c", kind: "" } as Record<string, string>)[n])).toEqual({ ok: true, row: { title: "T", year: 1856, alt: ["a", "b", "c"], kind: null } });
    expect(parseForm(F, () => "")).toEqual({ ok: false, message: "Title is required." }); const bad = parseForm(F, n => (n === "title" ? "x" : n === "year" ? "18x" : "")); expect(bad.ok).toBe(false);
  });
  it("renders escaped values and RTL fields", () => {
    const h = formHtml([{ name: "bio", label: "Bio", type: "textarea", dir: "rtl" }], { bio: "<b>x</b>" }, { action: "save", submit: "Save", data: { id: "a\"b" } });
    expect(h).not.toContain("<b>x</b>"); expect(h).toContain('dir="rtl"'); expect(h).toContain("&quot;");
  });
});
describe("local archive repository", () => {
  it("serves researched records and omits generic placeholder profiles", async () => {
    const r = await createLocalRepo(), l = await r.listScholars({ q: "kindi" }, "en"); expect(l.ok && l.data.items[0].slug).toBe("al-kindi");
    const all = await r.listScholars({}, "en"); expect(all.ok && all.data.items.every(s => s.researchDraft && [...s.works,...s.contributions,...s.events].some(x => x.refs.length))).toBe(true);
    expect((await r.getScholar("omar-khayyam")).ok).toBe(false);
    expect((await r.getScholar("nobody")).ok).toBe(false); const o = await r.filterOptions(); expect(o.ok && o.data.regions).toContain("Iraq"); const t = await r.timelineEvents({ t: "death" }, "en"); expect(t.ok && t.data.length).toBeGreaterThan(0);
  });
});
