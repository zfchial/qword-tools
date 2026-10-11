"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { categories, tools } from "@/lib/tools";

export default function Directory() {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState("all");
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("category");
    if (requested && categories.includes(requested)) setCategory(requested);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "/" && !["INPUT", "TEXTAREA"].includes((document.activeElement as HTMLElement)?.tagName ?? "")) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  const filtered = useMemo(() => tools.filter((tool) =>
    (category === "all" || tool.category === category) &&
    `${tool.name} ${tool.description} ${tool.category}`.toLowerCase().includes(query.trim().toLowerCase())
  ), [category, query]);

  return (
    <section className="directory" aria-labelledby="catalog-title">
      <div className="directory-intro flex flex-col gap-5 border-b pb-7 md:flex-row md:items-end md:justify-between">
        <p className="directory-lede max-w-2xl font-serif text-3xl leading-tight md:text-4xl">Small web tools for getting everyday work done faster.</p>
        <label className="search-box flex w-full items-center gap-3 rounded-lg border px-3 py-2 md:w-[min(410px,48%)]">
          <span aria-hidden="true" className="search-icon">⌕</span>
          <span className="sr-only">Search tools</span>
          <input ref={searchRef} aria-label="Search tools or formats" className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Search tools or formats" value={query} onChange={(event) => setQuery(event.target.value)} />
          <kbd className="rounded border px-1.5 py-0.5 text-[11px]">/</kbd>
        </label>
      </div>
      <div className="directory-body grid grid-cols-1 gap-7 pt-7 md:grid-cols-[190px_minmax(0,1fr)] md:gap-12 lg:gap-16">
        <aside aria-label="Tool categories" className="category-index flex gap-2 overflow-x-auto pb-2 md:sticky md:top-24 md:flex-col md:self-start md:overflow-visible">
          <h2 className="mb-2 hidden text-[11px] font-bold uppercase tracking-[.12em] md:block">Index</h2>
          {["all", ...categories].map((item) => <button aria-pressed={category === item} className={`category-button flex shrink-0 items-center justify-between gap-4 rounded-md px-3 py-2 text-left text-xs font-semibold transition-colors ${category === item ? "active" : ""}`} key={item} onClick={() => setCategory(item)}>{item === "all" ? "All" : item}<span>{item === "all" ? tools.length : tools.filter((tool) => tool.category === item).length}</span></button>)}
        </aside>
        <div className="min-w-0">
          <div className="catalog-heading mb-1 flex items-baseline justify-between gap-4 border-b-2 pb-3">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl" id="catalog-title">Tools, ready when you are</h1>
            <span aria-live="polite" className="result-count shrink-0 text-xs">{filtered.length} {filtered.length === 1 ? "tool" : "tools"}</span>
          </div>
          <div className="tools-list">
            {filtered.map((tool, index) => <article className="tool-row grid gap-3 py-5 md:grid-cols-[minmax(180px,.8fr)_minmax(0,1.6fr)_72px] md:items-center md:gap-6" key={tool.slug} style={{ "--row-index": index } as React.CSSProperties}>
              <div className="tool-identity min-w-0">
                <span className="tool-category mb-1 block text-[10px] font-bold uppercase tracking-wide">{tool.category}</span>
                <h2 className="text-sm font-semibold leading-snug"><Link className="tool-title transition-colors" href={`/tool/${encodeURIComponent(tool.slug)}`}>{tool.name}</Link></h2>
              </div>
              <p className="tool-description text-xs leading-relaxed">{tool.description}</p>
              <Link aria-label={`Open ${tool.name}`} className="open-link justify-self-start text-xs font-bold md:justify-self-end" href={`/tool/${encodeURIComponent(tool.slug)}`}>Open <span aria-hidden="true">↗</span></Link>
            </article>)}
          </div>
          {filtered.length === 0 && <p className="empty-state mt-5 rounded-lg border border-dashed p-7 text-center text-sm">No matching tools. Try another search or choose a different category.</p>}
        </div>
      </div>
    </section>
  );
}
