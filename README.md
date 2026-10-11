# Qword Tools

A collection of practical browser-based utilities built with Next.js, TypeScript, and Tailwind CSS.

## Features

- Search and filter 37 tools by category
- Responsive directory and individual tool pages
- Light and dark themes based on the system appearance
- Reduced-motion support and staggered list entrance animation
- MP4 to MP3 audio extraction and MP3 to MP4 video creation (optional still cover image)
- DOCX to PDF and PDF to DOCX server-side conversion (Docker converter image required)
- Client-side processing for most utilities
- MP4/DOCX/PDF/MP3 temporary files are removed after conversion
- Static generation for tool pages, sitemap, and robots rules

## Tech stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Node.js 22 or newer (Next.js 16 requires Node.js >=20.9)
- FFmpeg and FFprobe are required for MP4/MP3 conversion
- Docker is required for DOCX/PDF conversion; build the converter image with `docker build -f Dockerfile.converter -t qword-doc-converter .` before starting the app

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

- MP4 video files: 100 MB limit for MP3 extraction.
- MP3 audio files: 100 MB limit; optional cover images: 15 MB.
- DOCX and PDF documents: 50 MB limit.
- MP3-to-MP4 videos use a still cover image or plain background; PDF-to-DOCX conversion is approximate for complex layouts.
- All conversion temporary files are deleted after processing. Do not upload confidential files.

## Deployment

Run the production build before deployment. The app requires a Node.js runtime and should be served behind HTTPS in production. For media conversion, install `ffmpeg` and `ffprobe` on the host. For document conversion, build the `qword-doc-converter` Docker image before starting the app. Review request-size limits at both the application and reverse-proxy layers.

## License

No project license has been selected yet. All rights reserved unless a license file is added by the project owner.
