# LiberXMobile — Free Office Suite for Schools

A LibreOffice-inspired office suite built with Next.js 16 + TypeScript + Tailwind CSS + Zustand.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run dev server
npm run dev

# 3. Open http://localhost:3000
```

## Deploy to Vercel

1. Push this project to GitHub
2. Import the repo on [Vercel](https://vercel.com)
3. Deploy — no environment variables needed

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page (/)
│   └── app/page.tsx        # Office suite (/app)
├── components/
│   ├── landing/            # Landing page + loading animations
│   └── liberxoffice/       # Writer, Calc, Impress modules
├── stores/                 # Zustand state (app, calc, impress)
└── lib/                    # File I/O, templates, auto-correct
```

## Features

- **Writer** — Document editor with DOCX import/export, spell check
- **Calc** — Spreadsheet with formulas, XLSX support, charts
- **Impress** — Presentations with transitions, slide master
- **Landing Page** — Circular logo, fluid loading animation
- **PWA** — Installable, works offline

## License

MPLv2 — Based on LibreOffice
