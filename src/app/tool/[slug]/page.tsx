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
  return { title: tool.name, description: tool.description, alternates: { canonical: `https://qword-tools.com/tool/${encodeURIComponent(tool.slug)}` } };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();
  const related = tools.filter((item) => item.category === tool.category && item.slug !== tool.slug).slice(0, 4);
  return <ToolClient tool={tool} markup={renderToolInteractive(tool)} related={related} />;
}
