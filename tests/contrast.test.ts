import { readFileSync } from "node:fs";
import postcss from "postcss";
import { describe, expect, it } from "vitest";

const mainCss = readFileSync(new URL("../src/styles/main.css", import.meta.url), "utf8");
const redesignCss = readFileSync(new URL("../src/styles/redesign.css", import.meta.url), "utf8");
const footerHtml = readFileSync(new URL("../src/pages/footer.html", import.meta.url), "utf8");

function variables(selector: string): Record<string, string> {
  const values: Record<string, string> = {};
  postcss.parse(mainCss).walkRules(selector, rule => rule.walkDecls(decl => {
    if (decl.prop.startsWith("--")) values[decl.prop.slice(2)] = decl.value;
  }));
  return values;
}

function luminance(hex: string): number {
  const value = hex.length === 4 ? `#${[...hex.slice(1)].map(char => char + char).join("")}` : hex;
  const [r, g, b] = value.slice(1).match(/.{2}/g)!.map(value => parseInt(value, 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground: string, background: string): number {
  const a = luminance(foreground), b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function expectAa(foreground: string, background: string, label: string) {
  expect(contrast(foreground, background), `${label}: ${foreground} on ${background}`).toBeGreaterThanOrEqual(4.5);
}

describe("site-wide text contrast and footer attribution", () => {
  it.each([
    [":root", "light"],
    [":root:not([data-theme=\"light\"])", "system dark"],
    [":root[data-theme=\"dark\"]", "explicit dark"]
  ])("keeps semantic text tokens readable in %s theme", (selector, theme) => {
    const token = { ...variables(":root"), ...variables(selector) };
    expect(Object.keys(token).length, `${theme} token block exists`).toBeGreaterThan(0);
    const backgrounds = ["bg", "surface", "parchment", "parchment-dark", "quote-bg"].map(name => token[name]);
    for (const background of backgrounds) {
      for (const foreground of ["ink", "muted", "gold-text", "text-link", "emerald-text"]) {
        expectAa(token[foreground], background, `${theme} ${foreground}`);
      }
    }
    expectAa(token["on-green"], token.green, `${theme} heritage surface text`);
    expectAa(token["gold-on-dark"], token.green, `${theme} gold on heritage green`);
    expectAa("#14211b", token["gold-button"], `${theme} gold button label`);
  });

  it("keeps fixed heritage surfaces, passage excerpts, and footer text readable", () => {
    for (const foreground of ["#faf6ec", "#c9d3cc", "#e1ca8d", "#f1ead7"]) {
      expectAa(foreground, "#07130e", "site footer");
    }
    expectAa("#faf6ec", "#154631", "heritage work card");
    expectAa("#14211b", "#a8812c", "light theme gold button");
    expectAa("#14211b", "#d3ab52", "dark theme gold button");
    expectAa("#fff", "#8b321b", "danger button");
    expectAa("#14211b", "#fffaf0", "light theme passage excerpt");
    expectAa("#f1ead7", "#0b1511", "dark theme passage excerpt");
  });

  it("keeps theme tokens authoritative and scopes footer styling to the site footer", () => {
    expect(redesignCss).not.toMatch(/:root\s*\{/);
    expect(mainCss).toContain(".site-footer{");
    expect(mainCss).not.toMatch(/(?:^|})\s*footer\s*\{/);
    expect(mainCss).toContain("input::placeholder,textarea::placeholder");
  });

  it("adds one responsive creator contact block with a working mailto link", () => {
    expect(footerHtml.match(/Made by Husain Farooqui/g)).toHaveLength(1);
    expect(footerHtml).toContain("Web developer");
    expect(footerHtml).toContain('href="mailto:mohdhussainfarooqui0@gmail.com"');
    expect(footerHtml).toContain("Contact 7607402350");
    expect(footerHtml.indexOf("footer-creator")).toBeGreaterThan(footerHtml.indexOf("footer-bottom"));
    expect(mainCss).toContain(".footer-creator");
  });
});
