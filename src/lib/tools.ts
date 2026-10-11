import rawTools from "../../tools.json";

export type ToolFaq = { q: string; a: string };
export type Tool = {
  slug: string;
  name: string;
  category: string;
  description: string;
  type: string;
  seoText: string;
  faq: ToolFaq[];
};

export const tools = rawTools as Tool[];
export const categories = [...new Set(tools.map((tool) => tool.category))];
export function getTool(slug: string) {
  return tools.find((tool) => tool.slug === slug);
}
