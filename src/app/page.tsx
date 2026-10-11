import type { Metadata } from "next";
import Directory from "./directory";

export const metadata: Metadata = {
  title: "Free Online Tools: Text, Developer, Security & More",
  description: "Explore practical free online text, developer, security, conversion, and media tools. Search and use utilities directly in your browser.",
  alternates: { canonical: "https://qword.tech" },
  openGraph: { type: "website", siteName: "Qword Tools", locale: "en_US", url: "https://qword.tech", title: "Free Online Tools: Text, Developer, Security & More", description: "Explore practical free online text, developer, security, conversion, and media tools. Search and use utilities directly in your browser." },
  twitter: { card: "summary", title: "Free Online Tools: Text, Developer, Security & More", description: "Explore practical free online text, developer, security, conversion, and media tools. Search and use utilities directly in your browser." },
};

export default function HomePage() {
  return <Directory />;
}
