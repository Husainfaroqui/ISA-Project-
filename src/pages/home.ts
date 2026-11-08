import html from "./home.html?raw";
import { DISCIPLINES } from "../data/sample";
export const homeHtml = html;
export function homeMount(el: HTMLElement) {
  el.querySelector("#dossier")!.innerHTML = ["Biography", "Religious scholarship", "Mathematics", "Astronomy", "Bibliography", "Earth-motion debate"].map(d => `<div class="card"><h3>${d}</h3><span class="chip review">UNDER REVIEW</span></div>`).join("");
  el.querySelector("#discList")!.innerHTML = DISCIPLINES.map(d => `<div class="card"><h3>${d}</h3></div>`).join("");
}
