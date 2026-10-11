# Qword Tools

A collection of practical browser-based utilities built with Next.js, TypeScript, and Tailwind CSS.

## Features

- Search and filter 33 tools by category
- Responsive directory and individual tool pages
- Light and dark themes based on the system appearance
- Reduced-motion support and staggered list entrance animation
- Static generation for tool pages, sitemap, and robots rules
- Client-side processing for most utilities
- MP4-to-MP3 conversion API with upload validation and temporary-file cleanup

## Tech stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Node.js 22 or newer (Next.js 16 requires Node.js >=20.9)
- FFmpeg and FFprobe are required only for MP4-to-MP3 conversion

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

Most tools process data in the browser. The MP4-to-MP3 converter uploads the selected MP4 to the server for processing. Uploads are limited to 100 MB, and temporary input/output files are removed after conversion. Do not upload confidential media.

## Deployment

Run the production build before deployment. The app requires a Node.js runtime and should be served behind HTTPS in production. For MP4 conversion, install `ffmpeg` and `ffprobe` on the host. Review request-size limits at both the application and reverse-proxy layers.

## License

No project license has been selected yet. All rights reserved unless a license file is added by the project owner.
