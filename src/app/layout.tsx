import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Qword Tools — Free Online Utilities", template: "%s | Qword Tools" },
  description: "Practical free online tools for text, developers, security, conversion, and media.",
};

const navigation = [
  ["All tools", "/"],
  ["Writing", "/?category=Text%20%26%20Writing"],
  ["Developer", "/?category=Developer%20Tools"],
  ["Security", "/?category=Security%20%26%20Crypto"],
  ["Converters", "/?category=Converters%20%26%20Math"],
  ["Media", "/?category=Media%20%26%20Visuals"],
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="site-header sticky top-0 z-40 border-b backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-5 py-4 md:px-8">
            <Link href="/" className="wordmark text-xl font-extrabold tracking-tight">Qword<span>Tools</span></Link>
            <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold">
              {navigation.map(([label, href]) => href === "/" ? <Link className="nav-link transition-colors" href={href} key={label}>{label}</Link> : <a className="nav-link transition-colors" href={href} key={label}>{label}</a>)}
            </nav>
          </div>
        </header>
        <main className="mx-auto min-h-[70vh] w-full max-w-7xl px-5 py-7 md:px-8">{children}</main>
        <footer className="site-footer mt-10 border-t px-5 py-8 text-center text-sm md:px-8">
          <p>© {new Date().getFullYear()} Qword Tools. Simple tools for everyday work.</p>
          <nav aria-label="Site information" className="mt-3 flex justify-center gap-5">
            <Link href="/about">About</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/sitemap.xml">Sitemap</Link>
          </nav>
        </footer>
      </body>
    </html>
  );
}
