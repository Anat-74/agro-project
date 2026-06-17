const fs = require('fs');

let c = '';
c += '# Refactoring Plan - Agro Market\n\n';
c += '## Workflow Rules\n';
c += '- After completing each task, provide a brief report of what was done.\n';
c += '- Continue to the next task ONLY after user approval.\n';
c += '- Each step is executed strictly sequentially, one after another.\n';
c += '- After each step I wait for your confirmation before moving to the next.\n';
c += '- You verify that everything works, nothing is broken, and only then say "continue".\n';

c += '\n## Project Context\n\n';
c += '### Tech Stack & Versions\n';
c += '- Nuxt 4.4.8, Nitro 2.13.2, Vite 7.3.5, Vue 3.5.38\n';
c += '- SCSS (BEM), TypeScript, Pinia, Strapi 5.48.1 (Plesk), Netlify SSR (preset: netlify)\n\n';

c += '### CRITICAL: Strapi v5 API Patterns\n\n';
c += '1. locale - always inside filters with $eq\n';
c += '2. deep filters - only nested syntax (dot notation breaks with @nuxtjs/strapi: 400 error)\n';
c += '3. populate for components - no id field\n';
c += '4. sort - must be array: sort: [value]\n';
c += '5. as any required for all find() with generic types\n';
c += '6. getProductLink requires populated category/subcategory\n';
c += '7. fields - avoid id for media and components\n\n';

c += '### Single Media for Category/Subcategory images\n';
c += '- image field: single media (not array). Type: Image[] -> Image | null\n';
c += '- Access: item.image?.url (not item.image[0]?.url)\n';
c += '- Products: image remains array, mainImage is single\n\n';

c += '### Naming Convention for dialog components\n';
c += '- Panel (no backdrop, useShowMethod: true): Show prefix. Example: ShowHamburger.vue\n';
c += '- Modal (with backdrop, useShowMethod: false): ShowModal prefix. Example: ShowModalDiscountProduct.vue\n';
c += '- Pure modal without trigger: Modal suffix. Example: ConfirmDeleteModal.vue\n\n';

c += '---\n\n';
c += '## Web Vitals (Performance Monitoring)\n\n';
c += '### Structure\n';
c += '- composables/useWebVitals.ts - tracks LCP, CLS, INP\n';
c += '- server/api/web-vitals.post.ts - receives metrics\n';
c += '- server/api/web-vitals.get.ts - view metrics (GET /api/web-vitals)\n';
c += '- server/data/web-vitals.json - data file (created automatically)\n\n';
c += '### How to check in a new session\n';
c += '1. Start npm run dev (frontend)\n';
c += '2. Browse the site pages\n';
c += '3. Open http://localhost:3000/api/web-vitals - JSON with all metrics\n';
c += '4. Or read the file: cat frontend/server/data/web-vitals.json\n\n';
c += '### Known issues\n';
c += '- CLS: resets on pathname change (accumulation between pages fixed)\n';
c += '- LCP: cold start after build may show 37-38s (one-time)\n\n';

c += '---\n\n';
c += '## Tests (Unit Testing)\n\n';
c += '### Commands\n';
c += '- npx vitest run - full run\n';
c += '- npx vitest run --reporter=verbose - verbose output\n\n';
c += '### Existing tests\n';
c += '- useDialog: open -> isOpen === true, close -> isOpen === false, reuse by ID (2 tests)\n';
c += '- useDebounce: returns function, has cancel method (2 tests)\n\n';
c += '### Not tested (and why)\n';
c += '- Components (UButton, UInput) - blocked by @nuxtjs/color-mode\n';
c += '- Stores (useCartStore) - blocked by Nuxt auto-imports (#imports)\n\n';

c += '---\n\n';
c += '# User Profile (Cabinet) - Implementation Plan\n\n';
c += 'Strapi Users & Permissions + JWT.\n\n';
c += '### API endpoints (Strapi built-in)\n';
c += '- POST /api/auth/local/register\n';
c += '- POST /api/auth/local\n';
c += '- GET /api/users/me\n';
c += '- POST /api/auth/forgot-password\n';
c += '- POST /api/auth/reset-password\n\n';
c += '### Backend (Strapi)\n';
c += '- A1: Permissions (Public -> auth, Authenticated -> order by email)\n';
c += '- A2: Order -> User relation (by email or relation)\n';
c += '- A3: Email provider setup\n\n';
c += '### Frontend (Nuxt)\n';
c += '- B1: stores/useAuthStore.ts (user, token, login/register/logout)\n';
c += '- B2: composables/useAuth.ts (wrapper with isAuthenticated)\n';
c += '- B3: middleware/auth.ts (redirect if no token)\n';
c += '- B4: Pages login / register / cabinet / cabinet/[orderId]\n';
c += '- B5: Components AuthLogin, AuthRegister, OrderHistory\n';
c += '- B6: Locales locales/auth.ts + locales/cabinet.ts\n\n';
c += '### Estimated time: ~2.5 hours\n\n';

c += '---\n\n';
c += '## Future suggestions\n\n';
c += '- E2E tests (Playwright) - full cart/order flow check\n';
c += '- /search page - dedicated search results page\n';
c += '- Image optimization (responsive sets, srcset)\n';
c += '- i18n SEO - hreflang, sitemap for be locale\n';
c += '- PWA + Service Worker - offline mode\n';
c += '- Page transitions and skeleton screens\n';
c += '- Storybook for components\n';

fs.writeFileSync('.kilo/plans/1780243374090-swift-rocket.md', c, 'utf8');
console.log('OK: ' + c.length + ' chars');
