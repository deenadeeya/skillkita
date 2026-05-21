# SkillKita Web

React + TypeScript + Vite app backed by Supabase.

## Deploy to Vercel

1. Import this repository in [Vercel](https://vercel.com/new).
2. Set **Root Directory** to `skillkita-web` (recommended). Build settings come from `vercel.json` in this folder.
   - Alternatively, leave the repo root as the project root; the root `vercel.json` builds `skillkita-web` for you.
3. Add **Environment Variables** (Production and Preview): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — same names as in `.env.example`.
4. Deploy. SPA routes (`/login`, `/admin`, `/employer`, etc.) are rewritten to `index.html` so React Router works on refresh.
5. In **Supabase** → Authentication → URL Configuration, set **Site URL** and **Redirect URLs** to your Vercel domain (e.g. `https://your-app.vercel.app`).
6. **Home page images:** In Storage, create public buckets `site-assets` and `experience-photos` (if missing). Run `supabase/storage_site_assets.sql` in the SQL Editor (or `npx supabase db push` from `skillkita-web`). Also apply `migrations/20260521130000_landing_home_featured_photos.sql` if `home_featured_*_url` columns are missing.

Local dev: copy `.env.example` to `.env`, then `npm install` and `npm run dev`.

---

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
