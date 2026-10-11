# Qword Tools

A collection of practical browser-based utilities built with Next.js, TypeScript, and Tailwind CSS.

## Features

- Search and filter 66 tools by category
- Responsive directory and individual tool pages
- Light and dark themes based on the system appearance
- Reduced-motion support and staggered list entrance animation
- MP4 to MP3/GIF/thumbnail extraction and MP3 to MP4 video creation (optional still cover image)
- Audio conversion between MP3, WAV, and OGG
- DOCX to PDF and PDF to DOCX server-side conversion (Docker converter image required)
- PDF merging and image-to-PDF creation
- SEO helpers: meta tag generator, keyword density checker, readability analyzer
- Developer helpers: regex tester, text diff checker, Markdown preview, XML formatter
- Network helpers: DNS lookup, WHOIS/RDAP lookup, HTTP header checker, live SSL certificate checker
- Video compressor, audio cutter, and video trimmer
- Image converter (PNG/JPEG/WebP), favicon ICO generator, and photo cropper
- JSON to CSV converter, percentage calculator, and age calculator
- URL shortener (/s/ codes) and file share links (up to 100 MB, 7 days)
- Temp mail with auto-refresh inbox (via mail.tm API)
- Full-page website screenshots in desktop, tablet, or mobile viewports (headless Chromium required)
- Client-side processing for most utilities
- MP4/DOCX/PDF/MP3 temporary files are removed after conversion
- Static generation for tool pages, sitemap, and robots rules

## Tech stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Node.js 22 or newer (Next.js 16 requires Node.js >=20.9)
- FFmpeg and FFprobe are required for MP4/MP3/audio conversion
- Docker is required for DOCX/PDF conversion; build the converter image with `docker build -f Dockerfile.converter -t qword-doc-converter .` before starting the app
- pdf-lib is an npm dependency used for PDF merging and image-to-PDF creation
- playwright-core plus a headless Chromium binary are required for website screenshots; set SCREENSHOT_CHROME to override the default binary path

## Getting started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open <http://localhost:3000>.

Create and run a production build:

```bash
npm run build
npm run start
```

The production server uses `PORT` if set and otherwise listens on port 8080.

Type-check the project:

```bash
npm run lint
```

## Project structure

```text
src/app/                 App Router pages, API route, global styles
src/lib/tools.ts         Typed tool catalog and category helpers
src/lib/tool-markup.ts   Existing utility interface definitions
public/tool-engine.js    Browser-side utility implementations
 tools.json              Tool metadata and SEO content
```

The catalog is maintained in `tools.json`; the typed catalog in `src/lib/tools.ts` is used to render directory and tool routes.

## Privacy notes

Most tools process data in the browser. File converters upload to the server:

- MP4 video files: 100 MB limit for MP3/GIF/thumbnail extraction; GIF clips limited to 10 seconds.
- MP3 audio files: 100 MB limit; optional cover images: 15 MB.
- Audio files for format conversion: 50 MB limit (MP3, WAV, OGG).
- DOCX and PDF documents: 50 MB limit.
- PDF merge: 2 to 10 files, 25 MB each; image-to-PDF: up to 20 images, 10 MB each.
- MP3-to-MP4 videos use a still cover image or plain background; PDF-to-DOCX conversion is approximate for complex layouts.
- All conversion temporary files are deleted after processing. Do not upload confidential files.

## Deployment

Run the production build before deployment. The app requires a Node.js runtime and should be served behind HTTPS in production. For media conversion, install `ffmpeg` and `ffprobe` on the host. For document conversion, build the `qword-doc-converter` Docker image before starting the app. Review request-size limits at both the application and reverse-proxy layers.

## License

No project license has been selected yet. All rights reserved unless a license file is added by the project owner.
