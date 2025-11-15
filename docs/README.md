# Jarvis — Web Assistant (Vite + Tailwind)

This project is a browser-only JARVIS-like assistant built with Vite and Tailwind CSS — ready to deploy to **GitHub Pages**.

## What it does
- Chat-style UI, typing animation.
- Basic command parsing and categories (see `src/bot.js`).
- Web Speech API support for voice input (where available).
- Speech Synthesis for TTS output.
- LocalStorage-based memory (remember / show memory).
- Optional hook for external LLMs (you can add API integration manually).

## How to use locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run dev server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```
   This will create a `dist/` directory and copy it to `docs/` (useful for GitHub Pages from `docs/`).

## Deploy to GitHub Pages (two options)

### Option A — Use `docs/` folder (recommended)
1. Build: `npm run build` (copies `dist` to `docs/`)
2. Commit & push to GitHub (main branch).
3. In GitHub repo settings -> Pages, set Source to `main` branch and `/docs` folder.

### Option B — Use `gh-pages` branch
1. Build: `npm run build`
2. Create a `gh-pages` branch and push `dist` contents there (or use `gh-pages` npm package).
3. In GitHub Pages settings, set Source to `gh-pages` branch.

## Notes & Extending
- The assistant is intentionally client-only. Features that require a backend (system control, file access, advanced LLMs) are not available on GitHub Pages.
- To connect to an external LLM (e.g., OpenAI), add an API call in `src/bot.js` in the fallback section or create a proxy backend that holds your API key.

## License
MIT
