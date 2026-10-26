# CLAUDE.md — Wohnnormade Client v2

## Project Overview

Wohnnormade is a tenant reporting and review platform (German market focus). Users can report tenant violations, search tenant records, communicate with reporters, and manage their profiles. The app supports English and German.

**Production URL:** https://wohnnormade.com

## Tech Stack

- **Framework:** Next.js 14.2.5 (App Router)
- **Language:** TypeScript 5 (strict mode)
- **Styling:** Tailwind CSS 3.4.1, custom color theme, Montserrat font
- **Auth:** next-auth 4.24.11, cookie-based tokens (7-day expiry)
- **State:** React Context API (AuthContext, TenantContext, LanguageContext)
- **i18n:** i18next + react-i18next (en/de), localStorage persistence
- **PDF:** jspdf for tenant report downloads
- **Icons:** react-icons
- **Dates:** react-datepicker + date-fns
- **External API:** OpenStreetMap Nominatim (location autocomplete, no key needed)

## Commands

```bash
npm run dev       # Start dev server (localhost:3000)
npm run build     # Production build — run before committing to catch errors
npm run start     # Serve production build
npm run lint      # ESLint check
```

## Project Structure

```
src/
├── app/              # Next.js App Router pages & layouts
├── components/
│   ├── common/       # Reusable UI (Navbar, Footer, Button, SearchTennant, etc.)
│   ├── forms/        # Form components (Login, Register, ReportTennant, etc.)
│   ├── auth/         # ProtectedRoute HOC
│   ├── profile/      # UserProfile component
│   ├── icons/        # Custom icon components
│   └── providers/    # I18nProvider
├── context/          # AuthContext, TenantContext, LanguageContext
├── services/         # API client layer (auth, tenant, user, communication, location)
├── types/            # TypeScript type definitions
├── utils/            # Helpers (api, validation, date, tenantPdf, violationTypeTranslation)
└── i18n/             # i18next config + locale files (en.json, de.json)
```

## Architecture Decisions

- **Path alias:** `@/*` maps to `src/*` — always use `@/` imports
- **API base URL:** Configured via `NEXT_PUBLIC_API_URL` env var, defaults to `http://localhost:3001/api`
- **API utility:** Use `getApiUrl()` from `@/utils/api` to construct API URLs
- **Auth pattern:** Services use `getAuthHeaders()` from `@/services/auth` for authenticated requests
- **Provider order:** I18nProvider → LanguageProvider → AuthProvider → TenantProvider
- **Protected routes:** Wrap pages with `<ProtectedRoute>` component from `@/components/auth/ProtectedRoute`
- **No testing framework** is currently set up

## Coding Conventions

- **Semicolons:** Required (ESLint enforced)
- **Object spacing:** `{ key: value }` with spaces inside braces
- **File endings:** Must end with newline
- **Naming:** Component files use PascalCase, utils/services use camelCase
- **Spelling note:** "Tennant" (double n) is used in some component names — this is legacy, keep consistent within each file
- **Styling:** Use Tailwind utility classes inline. Custom colors defined in `tailwind.config.ts` (orange, blueLight, blueDark, purpleDdark, etc.)
- **Translations:** All user-facing strings must go through i18next. Keys live in `src/i18n/locales/en.json` and `de.json`

## Environment Variables

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api   # Backend API endpoint
```

## Key Patterns

### Adding a new page
1. Create directory under `src/app/[route-name]/`
2. Add `page.tsx` with metadata export
3. If protected, wrap content with `<ProtectedRoute>`

### Adding a new API service method
1. Add method to appropriate service file in `src/services/`
2. Use `getApiUrl()` for URL construction
3. Use `getAuthHeaders()` for authenticated endpoints
4. Follow existing error handling pattern (extract message from response)

### Adding translations
1. Add key to both `src/i18n/locales/en.json` and `de.json`
2. Use `useTranslation()` hook in components: `const { t } = useTranslation()`
3. Reference: `src/i18n/README.md`

### Working with forms
1. Form components live in `src/components/forms/`
2. Use validation functions from `@/utils/validation`
3. Validation functions return i18n translation keys for error messages
