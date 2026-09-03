# LiberXMobile — Free Office Suite for Indian Schools

A customized, LibreOffice-inspired office suite optimized for Class 9 & 10 students (CBSE/ICSE), built with Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui + Zustand.

## Features

- **Writer** — Full document editor with DOCX import/export, spell check, autotext, track changes, templates
- **Calc** — Spreadsheet with 65+ formulas, XLSX support, pivot tables, charts, conditional formatting, goal seek, named ranges
- **Impress** — Presentation editor with 15+ slide transitions, slide master, themes, animations, speaker notes
- **Landing Page** — Beautiful dark-themed landing page with circular logo, shine effect, and two CTAs
- **Loading Animation** — Compact 3D flip animation using the official logo
- **PWA** — Installable as an app (works offline, uses internal storage)

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- npm / bun

### Installation

1. **Extract the ZIP**:
   ```bash
   unzip LiberXMobile.zip -d liberxmobile
   cd liberxmobile
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   bun install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   # or
   bun run dev
   ```

4. **Open the app**:
   Navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
.
├── public/                     # Static assets (logos, manifest, service worker)
│   ├── logo-custom.png         # Official LiberXMobile logo
│   ├── bg-landing.png          # Background image
│   ├── manifest.json           # PWA manifest
│   └── sw.js                   # Service worker (offline support)
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout (metadata, manifest)
│   │   ├── page.tsx            # Landing page (route: /)
│   │   └── app/
│   │       └── page.tsx        # Office suite (route: /app)
│   ├── components/
│   │   ├── landing/
│   │   │   ├── landing-page.tsx        # Landing page with 2 CTAs
│   │   │   └── loading-animation.tsx   # Compact 3D flip loading animation
│   │   ├── liberxoffice/               # Office suite components
│   │   │   ├── start-center.tsx
│   │   │   ├── writer/                 # Writer module
│   │   │   ├── calc/                   # Calc module
│   │   │   ├── impress/                # Impress module
│   │   │   ├── shared/                 # Shared components (menu-bar, status-bar, etc.)
│   │   │   └── dialogs/                 # Dialog components
│   │   └── ui/                         # shadcn/ui components
│   ├── stores/                 # Zustand state stores
│   │   ├── app-store.ts
│   │   ├── calc-store.ts
│   │   └── impress-store.ts
│   └── lib/
│       ├── file-service.ts     # File I/O (DOCX, XLSX, PDF, CSV)
│       ├── templates.ts        # Template management
│       └── utils.ts
├── prisma/schema.prisma        # Database schema (optional)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Landing Page

The landing page (`/`) has two call-to-action buttons:

1. **Continue with Web** — Opens the office suite in the browser
2. **Download for Android** — Installs the PWA (works like a native app on Android)

When installed as a PWA on Android:
- App appears in the app drawer
- Opens directly to the office suite (skips landing page)
- Uses internal storage (Cache API + localStorage)
- Works completely offline

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| State | Zustand |
| Office Files | JSZip (DOCX), xlsx (XLSX) |
| Icons | Lucide React |
| PWA | Service Worker + Web App Manifest |

## Deploy on Vercel

1. Push this project to GitHub
2. Import the repository on [Vercel](https://vercel.com)
3. Deploy — no environment variables needed
4. The deployed URL works as the web version
5. On Android Chrome/Edge, "Download for Android" installs the PWA

## License

Mozilla Public License v2.0 (MPLv2)

Based on LibreOffice — a trademark of The Document Foundation. LiberXMobile is not affiliated with or endorsed by The Document Foundation.
