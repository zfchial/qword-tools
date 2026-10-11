import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTool, tools } from "@/lib/tools";
import { renderToolInteractive } from "@/lib/tool-markup";
import ToolClient from "../../tool-client";

export const dynamicParams = true;

export function generateStaticParams() {
  return tools.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return { title: "Tool Not Found" };
  const url = `https://qword.tech/tool/${encodeURIComponent(tool.slug)}`;
  const description = tool.seoText || tool.description;
  return { title: tool.name, description: tool.description, alternates: { canonical: url }, openGraph: { type: "website", siteName: "Qword Tools", locale: "en_US", url, title: tool.name, description }, twitter: { card: "summary", title: tool.name, description } };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();
  const related = tools.filter((item) => item.category === tool.category && item.slug !== tool.slug).slice(0, 4);
  const url = `https://qword.tech/tool/${encodeURIComponent(tool.slug)}`;
  const nodes: Record<string, unknown>[] = [{ "@type": "SoftwareApplication", name: tool.name, url, applicationCategory: "UtilitiesApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: tool.seoText || tool.description }];
  if (tool.faq?.length) nodes.push({ "@type": "FAQPage", mainEntity: tool.faq.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })) });
  const jsonLd = { "@context": "https://schema.org", "@graph": nodes };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} /><ToolClient tool={tool} markup={renderToolInteractive(tool)} related={related} /></>;
}
