import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { loadSiteEnv, siteEnvValue } from './scripts/site-env.mjs';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default defineConfig(({ mode }) => {
  const siteEnv = loadSiteEnv(mode);

  return {
    plugins: [
      react(),
      {
        name: 'site-html-config',
        transformIndexHtml(html) {
          return html
            .replaceAll('__SITE_NAME__', escapeHtml(siteEnvValue(siteEnv, 'VITE_SITE_NAME')))
            .replaceAll('__SITE_FAVICON_PATH__', escapeHtml(siteEnvValue(siteEnv, 'VITE_SITE_FAVICON_PATH')))
            .replaceAll("'__SITE_LOCALE_STORAGE_KEY__'", JSON.stringify(siteEnvValue(siteEnv, 'VITE_LOCALE_STORAGE_KEY')));
        },
      },
    ],
    server: {
      port: 5174,
      proxy: {
        '/api': 'http://127.0.0.1:3022'
      }
    }
  };
});
