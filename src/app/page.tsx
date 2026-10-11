import type { Metadata } from "next";
import Directory from "./directory";

export const metadata: Metadata = {
  title: "Free Online Tools: Text, Developer, Security & More",
  description: "Explore practical free online text, developer, security, conversion, and media tools. Search and use utilities directly in your browser.",
};

export default function HomePage() {
  return <Directory />;
}
