# Wohnnormade Client v2 — Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve code health, extract custom hooks, and optimize re-renders across the Wohnnormade client.

**Architecture:** 3 independent phases (code health -> hooks + component splitting -> re-render optimization), each delivered as a separate PR. No testing framework added.

**Tech Stack:** Next.js 14.2.5, TypeScript 5, React 18, Tailwind CSS, i18next

## Global Constraints

- **Semicolons required** (ESLint `semi: always`)
- **Object curly spacing** `{ key: value }` (ESLint `object-curly-spacing: always`)
- **Files end with newline** (ESLint `eol-last: always`)
- **Path alias:** `@/*` maps to `src/*` — always use `@/` imports
- **Tennant -> Tenant**: All file names, component names, and references must be renamed
- **No testing framework** is set up — do not add test files

---

## Phase 1: Code Health

### Task 1.1: Fix `PropetryWrecked` enum + consolidate `ApiResponse<T>`

**Files:**
- Modify: `src/types/tenant.ts`
- Modify: `src/services/communication.ts`
- Modify: `src/utils/violationTypeTranslation.ts`

**Interfaces:**
- Consumes: existing `ViolationType` enum
- Produces: fixed `PropertyWrecked` value, shared `ApiResponse<T>` in types

- [ ] **Step 1: Fix enum in `src/types/tenant.ts`**

Change `PropetryWrecked = 'PropetryWrecked'` to `PropertyWrecked = 'PropertyWrecked'`

- [ ] **Step 2: Add shared `ApiResponse<T>` to `src/types/tenant.ts`**

```typescript
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
```

- [ ] **Step 3: Fix translation mapping in `src/utils/violationTypeTranslation.ts`**

Change `propetryWrecked` key to `propertyWrecked` in the switch/map

- [ ] **Step 4: Remove local `ApiResponse` from `src/services/communication.ts`**

Delete the local `ApiResponse<T>` interface, import from `@/types`

- [ ] **Step 5: Commit**

```bash
git add src/types/tenant.ts src/services/communication.ts src/utils/violationTypeTranslation.ts
git commit -m "fix: correct PropetryWrecked enum and consolidate ApiResponse type"
```

---

### Task 1.2: Rename `TennantPreview` -> `TenantPreview`

- [ ] **Step 1: Rename the file**

`src/components/common/TennantPreview.tsx` -> `src/components/common/TenantPreview.tsx`

Update component name inside from `TennantPreview` to `TenantPreview`

- [ ] **Step 2: Update `src/components/common/index.ts`**

Change `TennantPreview` export to `TenantPreview`

- [ ] **Step 3: Update `src/app/tenant-preview/page.tsx`**

Change import from `TennantPreview` to `TenantPreview`

- [ ] **Step 4: Commit**

```bash
git add src/components/common/TenantPreview.tsx src/components/common/TennantPreview.tsx src/components/common/index.ts src/app/tenant-preview/page.tsx
git commit -m "refactor: rename TennantPreview to TenantPreview"
```

---

### Task 1.3: Rename `SearchTennant` -> `SearchTenant`

- [ ] **Step 1: Rename file + update component name**

`src/components/common/SearchTennant.tsx` -> `src/components/common/SearchTenant.tsx`
Change internal `SearchTennant` to `SearchTenant`

- [ ] **Step 2: Update `src/components/common/index.ts`**

Update export from `SearchTennant` to `SearchTenant`

- [ ] **Step 3: Update `src/app/search/page.tsx`**

Update import

- [ ] **Step 4: Commit**

```bash
git add src/components/common/SearchTenant.tsx src/components/common/SearchTennant.tsx src/components/common/index.ts src/app/search/page.tsx
git commit -m "refactor: rename SearchTennant to SearchTenant"
```

---

### Task 1.4: Rename `ReportTennantForm` -> `ReportTenantForm`

- [ ] **Step 1: Rename file + update component name**

`src/components/forms/ReportTennantForm.tsx` -> `src/components/forms/ReportTenantForm.tsx`
Change internal `ReportTennantForm` to `ReportTenantForm`

- [ ] **Step 2: Update `src/components/forms/index.ts`**

Update export; also add `TenantEditForm` if missing

- [ ] **Step 3: Update `src/app/contribute/page.tsx`**

Update import

- [ ] **Step 4: Commit**

```bash
git add src/components/forms/ReportTenantForm.tsx src/components/forms/ReportTennantForm.tsx src/components/forms/index.ts src/app/contribute/page.tsx
git commit -m "refactor: rename ReportTennantForm to ReportTenantForm"
```

---

### Task 1.5: Remove dead code + fix eslint config

**Files:**
- Modify: `src/app/HomeContent.tsx`
- Modify: `eslint.config.mjs`

- [ ] **Step 1: Remove dead `const test =` from `HomeContent.tsx`**

Delete line 12

- [ ] **Step 2: Fix `eslint.config.mjs`**

Replace with proper flat config using `@eslint/js` and `typescript-eslint`:

```javascript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      semi: ['error', 'always'],
      'object-curly-spacing': ['error', 'always'],
      'eol-last': ['error', 'always'],
    },
  },
];
```

- [ ] **Step 3: Run lint to verify**

Run: `npm run lint`

- [ ] **Step 4: Commit**

```bash
git add eslint.config.mjs src/app/HomeContent.tsx
git commit -m "fix: remove dead code and fix eslint config for flat config compatibility"
```

---

## Phase 2: Hooks Architecture

### Task 2.1: Extract `useUserProfile` hook

**Files:**
- Create: `src/hooks/useUserProfile.ts`
- Modify: `src/components/profile/UserProfile.tsx`

**Interfaces:**
- Produces: `{ profile, isLoading, updateProfile, changePassword, deleteAccount, error }`

- [ ] **Step 1: Create `src/hooks/useUserProfile.ts`**

```typescript
'use client';
import { useState, useEffect, useCallback } from 'react';
import { UserService } from '@/services/user';
import type { UserProfile } from '@/services/user';
import type { UpdateUserData } from '@/services/user';

export function useUserProfile(userId: string | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) { setIsLoading(false); return; }
    setIsLoading(true);
    UserService.getUserProfile(userId)
      .then(setProfile)
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [userId]);

  const updateProfile = useCallback(async (data: UpdateUserData) => {
    if (!userId) return;
    try {
      const updated = await UserService.updateProfile(userId, data);
      setProfile(updated);
    } catch (e: any) {
      throw new Error(e.message);
    }
  }, [userId]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!userId) return;
    await UserService.updateProfile(userId, { currentPassword, password: newPassword });
  }, [userId]);

  const deleteAccount = useCallback(async () => {
    if (!userId) return;
    await UserService.deleteAccount(userId);
  }, [userId]);

  return { profile, isLoading, error, updateProfile, changePassword, deleteAccount };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useUserProfile.ts
git commit -m "feat: add useUserProfile hook"
```

---

### Task 2.2: Extract `useRegisterForm` hook

**Files:**
- Create: `src/hooks/useRegisterForm.ts`
- Modify: `src/components/forms/RegisterForm.tsx`

- [ ] **Step 1: Create `src/hooks/useRegisterForm.ts`**

Hook managing form fields, validation state + submit using `AuthContext.register()` and `validateRegisterForm`

- [ ] **Step 2: Refactor `RegisterForm.tsx` to use the hook**

Reduce from 394 lines to ~200 by delegating all state + validation to the hook

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useRegisterForm.ts src/components/forms/RegisterForm.tsx
git commit -m "feat: extract useRegisterForm hook, slim RegisterForm"
```

---

### Task 2.3: Extract `useCommunicationThread` hook

**Files:**
- Create: `src/hooks/useCommunicationThread.ts`
- Modify: `src/app/communications/thread/[threadId]/page.tsx`

- [ ] **Step 1: Create `src/hooks/useCommunicationThread.ts`**

Hook managing thread messages, sending replies, loading state

- [ ] **Step 2: Refactor thread page to use hook + sub-components**

- [ ] **Step 3: Commit**

---

### Task 2.4: Extract `useContactReporter` hook

**Files:**
- Create: `src/hooks/useContactReporter.ts`
- Modify: `src/components/forms/ContactReporterForm.tsx`

- [ ] **Step 1: Create hook managing message state, validation, and API call**

- [ ] **Step 2: Refactor `ContactReporterForm.tsx` to use hook**

- [ ] **Step 3: Commit**

---

### Task 2.5: Split `UserProfile.tsx` into sub-components

**Files:**
- Create: `src/components/profile/ProfileInfoSection.tsx`
- Create: `src/components/profile/ReportedTenantsSection.tsx`
- Create: `src/components/profile/SecuritySection.tsx`
- Create: `src/components/profile/AccountActionsSection.tsx`
- Modify: `src/components/profile/UserProfile.tsx`

- [ ] **Step 1: Create `ProfileInfoSection.tsx`** — inline-editable name, surname, city, country fields + member since

- [ ] **Step 2: Create `ReportedTenantsSection.tsx`** — table of reported tenants with violation type, date, status

- [ ] **Step 3: Create `SecuritySection.tsx`** — password change form (current, new, confirm + show/hide toggles)

- [ ] **Step 4: Create `AccountActionsSection.tsx`** — logout + delete account buttons with confirmation

- [ ] **Step 5: Refactor `UserProfile.tsx`** — orchestrate hooks + 4 sections, drop from 656 to ~200 lines

- [ ] **Step 6: Commit**

---

### Task 2.6: Split communications thread into sub-components

**Files:**
- Create: `src/components/common/MessageList.tsx`
- Create: `src/components/common/MessageBubble.tsx`
- Create: `src/components/common/ReplyInput.tsx`
- Modify: `src/components/common/index.ts`

- [ ] **Step 1: Create `MessageBubble.tsx`** — single message display (sender, timestamp, content, alignment)

- [ ] **Step 2: Create `MessageList.tsx`** — scrollable list of MessageBubble components

- [ ] **Step 3: Create `ReplyInput.tsx`** — textarea + send button with char count

- [ ] **Step 4: Update thread page to use sub-components + hook**

- [ ] **Step 5: Commit**

---

## Phase 3: Re-render Optimization

### Task 3.1: Split AuthContext to prevent full-tree re-renders

**Files:**
- Modify: `src/context/AuthContext.tsx`

- [ ] **Step 1: Create separate dispatch context**

Split into `AuthContext` (provides `user`, `isAuthenticated`, `isLoading`) and `AuthDispatchContext` (provides `login`, `register`, `logout`). Components that only read values won't re-render when dispatch functions change.

```typescript
// AuthContext.tsx — restructured
export const AuthContext = createContext<AuthState>(initialState);
export const AuthDispatchContext = createContext<AuthDispatch | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  // ...login, register, logout functions
  return (
    <AuthContext.Provider value={state}>
      <AuthDispatchContext.Provider value={{ login, register, logout }}>
        {children}
      </AuthDispatchContext.Provider>
    </AuthContext.Provider>
  );
}

// Consumer hook
export function useAuth() {
  return useContext(AuthContext);
}
export function useAuthDispatch() {
  return useContext(AuthDispatchContext);
}
```

- [ ] **Step 2: Update consumers**

Components that only read (`Navbar`, `ProtectedRoute`) use `useAuth()`. Components that dispatch (`LoginForm`, `RegisterForm`) use `useAuthDispatch()`.

- [ ] **Step 3: Commit**

---

### Task 3.2: Apply `React.memo` to expensive components

**Files to modify (add `React.memo` wrapper):**
- `src/components/common/Navbar.tsx`
- `src/components/common/Footer.tsx`
- `src/components/common/LanguageSelector.tsx`
- `src/components/common/TenantPreview.tsx` (now `SearchTenant.tsx`)
- `src/components/common/MessageBubble.tsx`

- [ ] **Step 1: Wrap each component in `React.memo`**

- [ ] **Step 2: Audit child props — add `useCallback` where callbacks are passed to memo'd children**

Check `Navbar` (mobile menu toggle), `SearchTenant` (search callback), `MessageBubble` (action handlers)

- [ ] **Step 3: Add `useMemo` for derived data** — filtered tenant lists, formatted dates, computed classNames

- [ ] **Step 4: Commit**

---

### Task 3.3: Lazy-load heavy dependencies

**Files:**
- Modify: `src/utils/tenantPdf.ts` — dynamic import of `jspdf`
- Modify: `src/components/common/SearchTenant.tsx` — dynamic import of `react-datepicker`
- Modify: `src/components/common/DocumentPageLayout.tsx` — dynamic import of `react-markdown`

- [ ] **Step 1: Convert `jspdf` import in `tenantPdf.ts` to dynamic**

```typescript
export async function downloadTenantPdf(data: ..., labels: ...) {
  const { default: jsPDF } = await import('jspdf');
  // ... rest of function
}
```

Update callers to `await downloadTenantPdf(...)`

- [ ] **Step 2: Lazy-load `react-datepicker` in `SearchTenant.tsx`**

```typescript
const DatePicker = dynamic(() => import('react-datepicker'), { ssr: false });
```

- [ ] **Step 3: Lazy-load `react-markdown` in `DocumentPageLayout.tsx`**

```typescript
const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false });
```

- [ ] **Step 4: Verify build**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/utils/tenantPdf.ts src/components/common/SearchTenant.tsx src/components/common/DocumentPageLayout.tsx
git commit -m "perf: lazy-load jsPDF, react-datepicker, and react-markdown"
```
