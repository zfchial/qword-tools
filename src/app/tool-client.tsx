"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect } from "react";
import type { Tool } from "@/lib/tools";

function initializeTool(type: string) {
  (window as Window & { setupTool?: (type: string) => void }).setupTool?.(type);
}

export default function ToolClient({ tool, markup, related }: { tool: Tool; markup: string; related: Tool[] }) {
  useEffect(() => { initializeTool(tool.type); }, [tool.type]);
  return <>
    <Script src="/tool-engine.js?v=5" strategy="afterInteractive" onReady={() => initializeTool(tool.type)} />
    <nav aria-label="Breadcrumb" className="breadcrumbs mb-5 text-xs"><Link href="/">Home</Link><span aria-hidden="true"> / </span><span>{tool.category}</span><span aria-hidden="true"> / </span><span>{tool.name}</span></nav>
    <header className="tool-heading mb-6"><h1 className="text-3xl font-bold tracking-tight md:text-4xl">{tool.name}</h1><p className="tool-description mt-2 max-w-3xl">{tool.description}</p></header>
    <section aria-label={`${tool.name} interface`} className="tool-panel rounded-xl border p-5 shadow-sm md:p-7" dangerouslySetInnerHTML={{ __html: markup }} />
    <article className="tool-article mt-8 rounded-xl border p-5 md:p-7"><h2 className="text-xl font-bold">About {tool.name}</h2><p className="mt-3 leading-relaxed">{tool.seoText || tool.description}</p>
      {!!tool.faq?.length && <section className="mt-7"><h2 className="text-xl font-bold">Frequently asked questions</h2><div className="mt-4 space-y-4">{tool.faq.map((faq) => <div className="faq-item" key={faq.q}><h3 className="font-semibold">{faq.q}</h3><p className="mt-1 text-sm leading-relaxed">{faq.a}</p></div>)}</div></section>}
    </article>
    {!!related.length && <section className="mt-8"><h2 className="text-xl font-bold">Related tools</h2><ul className="mt-3 grid gap-3 sm:grid-cols-2">{related.map((item) => <li className="related-item rounded-lg border p-4" key={item.slug}><Link className="font-semibold" href={`/tool/${encodeURIComponent(item.slug)}`}>{item.name}</Link><p className="mt-1 text-sm">{item.description}</p></li>)}</ul></section>}
  </>;
}
