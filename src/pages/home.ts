import html from "./home.html?raw";
import { getRepo } from "../lib/repo";
import { DISCIPLINES } from "../data/sample";
import { displayName } from "../lib/search";
import { dName, rName, tr, type Lang } from "../lib/i18n";
import { esc, safeUrl } from "../lib/dom";
import { eventItemHtml } from "./timeline";
import type { Scholar } from "../lib/types";
export const homeHtml = html;

const copy: Record<Lang, Record<string, string>> = {
  en: {mission:"A living archive of scholarship and discovery",hero_h:"The ideas that shaped a world of knowledge.",hero_p:"Explore the scholars, works and scientific traditions documented across Islamic history."},
  ur: {mission:"علمی روایت اور دریافت کا زندہ آرکائیو",hero_h:"وہ خیالات جنہوں نے علم کی دنیا کو تشکیل دیا۔",hero_p:"اسلامی تاریخ میں documented علمی شخصیات، کام اور روایات کو تلاش کریں۔"},
  ar: {mission:"أرشيف حيّ للمعرفة والاكتشاف",hero_h:"أفكار شكّلت عالماً من المعرفة.",hero_p:"اكتشف العلماء والمؤلفات والتقاليد العلمية الموثقة عبر التاريخ الإسلامي."}
};
Object.assign(copy.en,{mission:"A living museum of scholarship and discovery",hero_h:"Preserving the Legacy of Knowledge.",hero_p:"Explore the scholars, discoveries, manuscripts and intellectual traditions that shaped the history of science and civilization."});
Object.assign(copy.ur,{mission:"علمی تحقیق اور دریافت کا زندہ عجائب گھر",hero_h:"علم کی میراث کو محفوظ کرنا۔",hero_p:"ان علماء، دریافتوں، مخطوطات اور فکری روایات کو دیکھیں جنہوں نے سائنس اور تہذیب کی تاریخ کو تشکیل دیا۔"});
Object.assign(copy.ar,{mission:"متحف حيّ للبحث والاكتشاف",hero_h:"نحفظ إرث المعرفة.",hero_p:"اكتشف العلماء والاكتشافات والمخطوطات والتقاليد الفكرية التي شكلت تاريخ العلم والحضارة."});
Object.assign(copy.en,{manuscript_e:"From the Original Pages of History",manuscript_profile:"Explore al-Khwārizmī’s profile →"});
Object.assign(copy.ur,{manuscript_e:"تاریخ کے اصل اوراق سے",manuscript_profile:"الخوارزمی کا پروفائل دیکھیں ←"});
Object.assign(copy.ar,{manuscript_e:"من الصفحات الأصلية للتاريخ",manuscript_profile:"استكشف ملف الخوارزمي ←"});
Object.assign(copy.en,{objects_e:"The collection · selected originals",objects_h:"Objects of Knowledge",objects_p:"Surviving objects and manuscript copies, identified with their repositories and historical context."});
Object.assign(copy.ur,{objects_e:"مجموعہ · منتخب اصل آثار",objects_h:"علمی ورثے کے تاریخی آثار",objects_p:"محفوظ تاریخی اشیاء اور مخطوطات کی نقلیں، ان کے ذخیرے اور تاریخی پس منظر کے ساتھ۔"});
Object.assign(copy.ar,{objects_e:"المجموعة · مختارات أصلية",objects_h:"آثار المعرفة",objects_p:"قطع باقية ونسخ مخطوطات موثّقة بمستودعاتها وسياقها التاريخي."});
const txt = (l: Lang, k: string) => copy[l][k] ?? k;
const imageBySlug: Record<string, string> = { "ahmad-raza-khan":"/images/ill-knowledge.svg", "al-khwarizmi":"/images/ill-algebra.svg", "ibn-al-haytham":"/images/ill-optics.svg", "al-biruni":"/images/ill-astronomy.svg", "ibn-sina":"/images/ill-knowledge.svg" };
const portraitBySlug: Record<string, string> = { "al-khwarizmi":"/images/ill-algebra.svg", "ibn-al-haytham":"/images/ill-optics.svg", "al-biruni":"/images/ill-astronomy.svg", "ibn-sina":"/images/ill-knowledge.svg" };
const dargahPhoto = "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Gumbad_Of_Dargah_Aala_Hazrat_4.jpg/960px-Gumbad_Of_Dargah_Aala_Hazrat_4.jpg";
const dargahFile = "https://commons.wikimedia.org/wiki/File:Gumbad_Of_Dargah_Aala_Hazrat_4.jpg";
const photoLabel:Record<Lang,string>={en:"Photograph of the Dargah dome",ur:"درگاہ کے گنبد کی اصل تصویر",ar:"صورة فوتوغرافية لقبة الضريح"};
const art = (slug: string) => imageBySlug[slug] ?? "/images/ill-knowledge.svg";
const portrait = (slug: string) => portraitBySlug[slug] ?? "/images/ill-knowledge.svg";
const safeSource = (href?: string) => safeUrl(href);
const card = (s: Scholar, l: Lang, featured = false) => {
  const isDargah=s.slug==="ahmad-raza-khan";
  const imgSrc = isDargah ? dargahPhoto : portrait(s.slug);
  const fallbackSrc = isDargah ? "/images/dargah-arch.svg" : art(s.slug);
  return `<article class="scholar-card ${featured ? "feature-card" : ""}"><a class="scholar-image" href="/${l}/scholars/${esc(s.slug)}"><img data-fallback-src="${fallbackSrc}" src="${imgSrc}" alt="${esc(s.names.en)}" loading="lazy" decoding="async" /></a><div class="scholar-card-body"><h3><a href="/${l}/scholars/${esc(s.slug)}">${esc(s.names[l] ?? s.names.en)}</a></h3><p class="muted">${esc(s.region)}</p></div></article>`;
};
function bindDargahFallback(root: ParentNode){
  root.querySelectorAll<HTMLImageElement>("img[data-dargah]").forEach(img=>img.addEventListener("error",()=>{img.src="/images/dargah-arch.svg";img.alt="Illustrated academic portrait";}, { once: true }));
}
function bindImageFallback(root: ParentNode, fallbackDefault = "/images/ill-knowledge.svg"){
  root.querySelectorAll<HTMLImageElement>("img[data-fallback-src]").forEach(img => {
    const fallback = img.dataset.fallbackSrc || fallbackDefault;
    img.addEventListener("error", () => {
      if (img.dataset.fallbackApplied === "true") return;
      img.dataset.fallbackApplied = "true";
      img.src = fallback;
    }, { once: true });
  });
}

export async function homeMount(el: HTMLElement, lang: Lang) {
  const museumViewer = el.querySelector<HTMLDialogElement>(".museum-viewer");
  const museumImg = museumViewer?.querySelector<HTMLImageElement>(".museum-viewer-stage img");
  const museumCaption = museumViewer?.querySelector<HTMLElement>(".museum-viewer-toolbar p");
  const museumObjects: Record<string, { src: string; alt: string; caption: string; source: string }> = {
    astrolabe: { src: "/images/homepage/rasulid-astrolabe-1291.jpg", alt: "Rasulid astrolabe made in Yemen in 1291", caption: "Astrolabe of ʿUmar ibn Yūsuf · Yemen, 1291 · The Met 91.1.535a–535b", source: "https://www.metmuseum.org/art/collection/search/451995" },
    "blue-quran": { src: "/images/homepage/blue-quran-folio.jpg", alt: "Gold and silver script on indigo parchment", caption: "Folio from the Blue Qur’an · 9th–10th century · The Met 2004.88", source: "https://www.metmuseum.org/art/collection/search/456839" }
  };
  el.querySelectorAll<HTMLButtonElement>("[data-museum-image]").forEach(button => button.addEventListener("click", () => {
    const item = museumObjects[button.dataset.museumImage ?? ""];
    if (!item || !museumViewer || !museumImg) return;
    museumImg.src = item.src; museumImg.alt = item.alt;
    if (museumCaption) museumCaption.textContent = item.caption;
    const link = museumViewer.querySelector<HTMLAnchorElement>("[data-museum-source]");
    if (link) link.href = item.source;
    museumViewer.showModal();
  }));
  museumViewer?.querySelector("[data-museum-close]")?.addEventListener("click", () => museumViewer.close());
  museumViewer?.addEventListener("click", event => { if (event.target === museumViewer) museumViewer.close(); });
  const t = (k:string) => txt(lang,k), repo = await getRepo();
  el.querySelectorAll<HTMLElement>("[data-i18n]").forEach(n => { const v=copy[lang][n.dataset.i18n!]; if(v)n.textContent=v; });
  const queryLabel=el.querySelector<HTMLLabelElement>('label[for="homeQuery"]'); if(queryLabel)queryLabel.textContent=t("search");
  const q=el.querySelector<HTMLInputElement>("#homeQuery"); if(q)q.placeholder=t("search_hint");
  const periodNames:Record<Lang,string[]>={en:["All periods","Early","Classical","Modern"],ur:["تمام ادوار","ابتدائی","کلاسیکی","جدید"],ar:["كل الفترات","مبكرة","كلاسيكية","حديثة"]};
  const periodSelect=el.querySelector<HTMLSelectElement>("#homePeriod");periodSelect?.querySelectorAll("option").forEach((o,i)=>{o.textContent=periodNames[lang][i]??o.textContent;});
  const filterOptions=await repo.filterOptions();
  if(filterOptions.ok){
    const add=(id:string,values:string[],label:(x:string)=>string)=>{const s=el.querySelector<HTMLSelectElement>("#"+id);if(s)for(const v of values){const o=document.createElement("option");o.value=v;o.textContent=label(v);s.appendChild(o);}};
    add("homeDiscipline",filterOptions.data.disciplines,v=>dName(lang,v));add("homeRegion",filterOptions.data.regions,v=>rName(lang,v));
  }
  const [featuredResponses, initial] = await Promise.all([
    Promise.all(["ahmad-raza-khan","al-khwarizmi","ibn-al-haytham","al-biruni"].map(x=>repo.getScholar(x))),
    repo.listScholars({page:1},lang)
  ]);
  const extraInitial=initial.ok&&initial.data.pages>1?await repo.listScholars({page:2},lang):null;
  const initialScholars=initial.ok?[...initial.data.items,...(extraInitial?.ok?extraInitial.data.items:[])]:[];
  const featured=featuredResponses.filter((r):r is Extract<typeof r,{ok:true}>=>r.ok).map(r=>r.data);
  const f=el.querySelector<HTMLElement>("#featuredScholars"); if(f)f.innerHTML=featured.length?featured.map(s=>card(s,lang,true)).join(""):`<p class="muted">${esc(t("empty"))}</p>`;
  if(f) { bindDargahFallback(f); bindImageFallback(f); }
  const spotlight=el.querySelector<HTMLElement>("#scholarSpotlight");
  if(spotlight){
    const firstPage=await repo.listScholars({page:1},lang);
    if(!firstPage.ok)spotlight.innerHTML=`<p class="muted">${esc(t("spotlight_empty"))}</p>`;
    else{
      const rest=await Promise.all(Array.from({length:Math.max(0,firstPage.data.pages-1)},(_,i)=>repo.listScholars({page:i+2},lang)));
      const all=[...firstPage.data.items,...rest.flatMap(x=>x.ok?x.data.items:[])].filter(s=>s.kind!=="group");
      const eligible=all.filter(s=>s.contributions.some(c=>c.refs.length)&&s.works.some(w=>w.refs.length)).sort((a,b)=>a.slug.localeCompare(b.slug));
      if(!eligible.length)spotlight.innerHTML=`<p class="muted">${esc(t("spotlight_empty"))}</p>`;
      else{
        const today=new Date(),year=today.getUTCFullYear(),start=Date.UTC(year,0,1),day=Math.floor((Date.UTC(year,today.getUTCMonth(),today.getUTCDate())-start)/86400000);
        const s=eligible[day%eligible.length],c=s.contributions.find(x=>x.refs.length)!,workIndex=s.works.findIndex(x=>x.refs.length),w=s.works[workIndex],isDargah=s.slug==="ahmad-raza-khan";
        const img=isDargah?dargahPhoto:portrait(s.slug),caption=isDargah?photoLabel[lang]:t("art_label");
        spotlight.innerHTML=`<article class="scholar-spotlight"><a class="spotlight-visual" href="/${lang}/scholars/${esc(s.slug)}"><img data-fallback-src="${isDargah?"/images/dargah-arch.svg":"/images/ill-knowledge.svg"}" src="${img}" alt="${esc(s.names[lang] ?? s.names.en)}" loading="eager" decoding="async" /></a><div class="spotlight-copy"><p class="eyebrow">${esc(t("spotlight_e"))}</p><h3><a href="/${lang}/scholars/${esc(s.slug)}">${esc(s.names[lang] ?? s.names.en)}</a></h3><p class="spotlight-title">${esc(s.region)}</p><p class="spotlight-bio">${esc(c.text)}</p><p class="spotlight-work"><strong>${esc(w.title)}</strong></p><div class="spotlight-actions"><a class="btn" href="/${lang}/scholars/${esc(s.slug)}">${esc(t("view_profile"))}</a><a class="btn secondary" href="/${lang}/scholars/${esc(s.slug)}#works">${esc(t("view_work"))}</a></div><p class="muted">${esc(caption)}</p></div></article>`;
        bindImageFallback(spotlight);
      }
    }
  }
  const works=featured.flatMap(s=>s.works.filter(w=>w.refs.length).map(w=>({s,w}))).slice(0,6);
  const wf=el.querySelector<HTMLElement>("#featuredWorks");
  if(wf)wf.innerHTML=works.length?works.map(({s,w})=>{const source=w.refs.find(x=>safeSource(x.url));return `<article class="work-card"><a class="work-visual" href="/${lang}/scholars/${esc(s.slug)}"><img src="${art(s.slug)}" alt="${esc(s.names.en)}" loading="lazy" decoding="async" /></a><div class="work-body"><h3><a href="/${lang}/scholars/${esc(s.slug)}">${esc(s.names[lang] ?? s.names.en)}</a></h3><p>${esc(w.title)}</p>${source?`<a class="cite" href="${safeSource(source.url) ?? "#"}" target="_blank" rel="noopener noreferrer">${esc(source.title)}</a>`:""}</div></article>`;}).join(""):`<p class="muted">${esc(t("empty"))}</p>`;
  const disciplines=el.querySelector<HTMLElement>("#discList"); if(disciplines){const available=filterOptions.ok&&filterOptions.data.disciplines.length?filterOptions.data.disciplines:DISCIPLINES;disciplines.innerHTML=available.map(d=>`<div class="card"><h3>${esc(dName(lang,d))}</h3></div>`).join("")||`<p class="muted">${esc(t("empty"))}</p>`;}
  const list=el.querySelector<HTMLElement>("#moreScholars");
  const renderMatches=async(qv="",dv="",pv="",rv="")=>{if(!list)return;list.innerHTML=`<p class="muted" role="status">${esc(tr(lang,"loading"))}</p>`;const res=await repo.listScholars({q:qv,d:dv,p:pv,r:rv,page:1},lang);if(!res.ok){list.innerHTML=`<p class="muted">${esc(t("empty"))}</p>`;return;}const items=res.data.items.filter(s=>!featured.some(f=>f.slug===s.slug)).slice(0,8);list.innerHTML=items.length?items.map(s=>card(s,lang)).join(""):`<p class="muted">${esc(t("empty"))}</p>`;bindImageFallback(list);};
  if(list&&initial.ok){const omit=new Set(featured.map(s=>s.slug));list.innerHTML=initialScholars.filter(s=>!omit.has(s.slug)).slice(0,4).map(s=>card(s,lang)).join("")||`<p class="muted">${esc(t("empty"))}</p>`;bindImageFallback(list);}
  const form=el.querySelector<HTMLFormElement>("#homeSearch"); form?.addEventListener("submit",e=>{e.preventDefault();const p=new URLSearchParams();const qv=q?.value.trim()??"",dv=el.querySelector<HTMLSelectElement>("#homeDiscipline")?.value??"",pv=el.querySelector<HTMLSelectElement>("#homePeriod")?.value??"",rv=el.querySelector<HTMLSelectElement>("#homeRegion")?.value??""; if(qv) p.set("q",qv); if(dv) p.set("d",dv); if(pv) p.set("p",pv); if(rv) p.set("r",rv); void renderMatches(qv,dv,pv,rv);});
  const refresh=()=>void renderMatches(q?.value.trim()??"",el.querySelector<HTMLSelectElement>("#homeDiscipline")?.value??"",el.querySelector<HTMLSelectElement>("#homePeriod")?.value??"",el.querySelector<HTMLSelectElement>("#homeRegion")?.value??"");
  ["homeDiscipline","homePeriod","homeRegion"].forEach(id=>el.querySelector<HTMLSelectElement>("#"+id)?.addEventListener("change",refresh));
  const contributions=el.querySelector<HTMLElement>("#homeContributions");const highlights=featured.flatMap(s=>s.contributions.filter(c=>c.refs.length).slice(0,1).map(c=>({s,c}))).slice(0,3);if(contributions)contributions.innerHTML=highlights.length?highlights.map(({s,c})=>`<article><h3>${esc(c.title ?? s.names.en)}</h3><p>${esc(c.text)}</p></article>`).join(""):`<p class="muted">${esc(t("empty"))}</p>`;
  const network=el.querySelector<HTMLElement>("#homeNetwork");const rels=featured.flatMap(s=>s.relations.filter(r=>r.refs.length).map(r=>({s,r}))).slice(0,4);if(network)network.innerHTML=rels.length?rels.map(({s,r})=>`<article class="network-item"><h3>${esc(s.names[lang] ?? s.names.en)}</h3><p>${esc(r.description ?? r.type)}</p></article>`).join(""):`<p class="muted">${esc(t("empty"))}</p>`;
  const timeline=el.querySelector<HTMLElement>("#homeTimeline");const events=await repo.timelineEvents({},lang);if(timeline)timeline.innerHTML=events.ok&&events.data.length?`<ol class="tl home-tl">${events.data.slice(0,5).map(e=>`<li><span class="yr">${esc(String(e.yearEarliest))}</span><h3>${esc(e.title)}</h3><p class="muted">${esc(e.description ?? "")}</p></li>`).join("")}</ol>`:`<p class="muted">${esc(t("empty"))}</p>`;
}
