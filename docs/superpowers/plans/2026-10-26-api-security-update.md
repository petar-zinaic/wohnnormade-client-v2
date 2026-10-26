# Wohnnormade Client v2 — Adapting to the API Security Update

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the client for the security and bug-fix release of `wohnnormade-api`, and fix the client bugs that release exposed.

**Background:** The API now:
- uses a real `JWT_SECRET`, so every token issued before the switch is invalid
- returns real HTTP status codes with an `internal_code`
- requires login for `/users/*` and allows only owners to change tenants and accounts
- ships a token-based password reset

The client has no handling for any of this, and nothing in it ever implemented password reset.

**Architecture:** One PR, tasks in order. Task 1 is urgent: production users are already affected since `JWT_SECRET` was changed.

**Tech Stack:** Next.js 14.2.5 (App Router), TypeScript 5, React 18, Tailwind CSS, i18next (en/de)

## Global Constraints

- Follow `CLAUDE.md`: semicolons, `{ key: value }` spacing, newline at end of file, `@/` imports.
- Every user-facing string goes through i18next, with keys in **both** `en.json` and `de.json`.
- No testing framework is set up, so don't add test files. Verify with `npm run build`, `npm run lint` and the manual checks at the end.

## API contract after the update (reference)

Every response uses the same envelope:

```json
// success
{ "result": <data>, "status": true, "error": {} }
// failure
{ "result": {}, "status": false, "error": { "status": 401, "message": "Invalid email or password.", "internal_code": "invalid_credentials" } }
```

| HTTP | `internal_code` | Meaning for the client |
| ---- | --------------- | ---------------------- |
| 400 | `request_body_validation` | Invalid input (the message is an English Joi message) |
| 400 | `invalid_query` | Bad search parameters |
| 400 | `invalid_reset_token` | Reset link unknown, expired (1 h) or already used |
| 401 | `missing_token` | Token missing, invalid or expired → **session is over** |
| 401 | `invalid_credentials` | Wrong email/password, or wrong *current* password → **not** a session problem |
| 403 | `forbidden` | Not your account or tenant, or not your thread |
| 404 | `not_found` | User, tenant or thread doesn't exist |
| 409 | `email_already_exists` | Email taken |
| 500 | `internal_error` | Generic server error |

Endpoint changes:
- `POST /auth/reset-password` takes `{ token, newPassword }` (`token` is 64 hex characters from the email link `<CLIENT_URL>/reset-password?token=...`).
- `POST /auth/forgot-password` always returns `{ result: { message } }`, whether or not the email exists.
- `/users/*` needs `Authorization: Bearer <token>`. PUT and DELETE on another user's account → 403. PUT rejects unknown fields (only `email`, `name`, `surname`, `city`, `country` are allowed).
- `PUT` and `DELETE` on `/tenant/:id` are allowed only for the reporter (`tenant.createdById`); anyone else → 403. A non-numeric id → 400. A missing tenant → 404 (previously an empty 204).
- `GET /tenant/search` without `q` or with an invalid `dateOfBirth` → 400.
- `POST /communications/contact-reporter`: `recipientId` must equal `tenant.createdBy.id`.
- `DELETE /users/:id` now also deletes that user's tenant reports and conversations.
- JWTs expire after **24 h**, but the client keeps its cookies for 7 days.

---

## Task 0: Production configuration check (no code)

- [ ] In Railway (API service → Variables), confirm `CLIENT_URL=https://wohnnormade.com`. Reset and thread links in emails are built from it; the default is `http://localhost:3000`.
- [ ] Confirm `FROM_EMAIL` uses a domain verified in Resend. Otherwise no reset emails are sent (the API logs the failure but still returns 200).

---

## Task 1: Central API error handling and session expiry (URGENT)

**Why:** After the `JWT_SECRET` change, everyone still has a 7-day cookie holding a token the API now rejects. `AuthContext` treats them as logged in, so every call fails with "Authentication token was not provided." and nothing logs them out. The same happens to every user 24 h after login, because the cookie outlives the token.

**Files:**
- Modify: `src/utils/api.ts`
- Modify: `src/services/auth.ts`, `src/services/tenant.ts`, `src/services/user.ts`, `src/services/communication.ts`
- Modify: `src/types/tenant.ts` (the `ApiResponse` error shape)
- Modify: `src/app/login/page.tsx` or `src/components/forms/LoginForm.tsx`
- Modify: `src/i18n/locales/en.json`, `de.json`

- [ ] **Step 1: Add `ApiError` and `apiFetch` to `src/utils/api.ts`**

```ts
export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
  }
}

export const SESSION_EXPIRED_EVENT = "auth:session-expired";

// Wraps fetch: parses the API envelope, throws ApiError, and signals an expired session
export async function apiFetch<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(getApiUrl(endpoint), init);
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const code: string | undefined = body?.error?.internal_code;
    if (response.status === 401 && code === "missing_token" && typeof window !== "undefined") {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    throw new ApiError(body?.error?.message || response.statusText, response.status, code);
  }

  return (body?.result ?? body) as T;
}
```

Only `missing_token` ends the session. `invalid_credentials` (a wrong login or wrong current password) must **not** log the user out.

- [ ] **Step 2: Rewrite the service methods on top of `apiFetch`.** This also adds the missing `response.ok` checks in `getTenants`, `getTenantById` and `searchTenants`, which today parse a 404/400 error body as if it were data. Keep the public method names. Each method now returns the unwrapped `result`, so remove the `(response as any).result || .data || response` fallbacks in `TenantContext`, `SearchTenant` and the other callers.

- [ ] **Step 3: Handle expiry in `AuthContext`.** Listen for `SESSION_EXPIRED_EVENT`; on it, call `logout()` and `router.push("/login?sessionExpired=1")`. Show `t("auth.sessionExpired")` on the login page when that query parameter is present.

- [ ] **Step 4: Align the cookie lifetime with the JWT.** In `AuthService.setAuthData`, set both cookies to **1 day** instead of 7. Better still, read the `exp` claim from the JWT payload with `JSON.parse(atob(token.split(".")[1]))` and set the cookie to expire then.

- [ ] **Step 5: Remove the credential logging in `AuthService`.** `login` and `register` currently `console.log` the submitted data, including the **password**, plus the full response and the extracted token. Delete those `console.log` calls (and the ones in `AuthContext`).

- [ ] **Step 6: Translate errors by code.** Add an `apiErrors` block to `en.json` and `de.json` with one key per `internal_code` from the table above. Add a helper `getErrorMessage(err, t, fallbackKey)` in `src/utils/api.ts`: it returns `t("apiErrors." + err.code)` when that key exists, otherwise `t(fallbackKey)`. Use it in place of raw `err.message` in the forms and pages that show API errors. The API messages are English only.

---

## Task 2: Reset-password page (new)

**Why:** The reset email links to `/reset-password?token=...`, a page that doesn't exist yet.

**Files:**
- Create: `src/app/reset-password/page.tsx`
- Create: `src/components/forms/ResetPasswordForm.tsx` (export it from `src/components/forms/index.ts`)
- Modify: `src/services/auth.ts`, `src/app/robots.ts`, `en.json`, `de.json`

- [ ] **Step 1:** Add `AuthService.forgotPassword(email)` (`POST auth/forgot-password`) and `AuthService.resetPassword(token, newPassword)` (`POST auth/reset-password`), both using `apiFetch`.
- [ ] **Step 2:** Create `page.tsx`, modelled on `src/app/forgot-password/page.tsx` (with `robots: { index: false, follow: false }`). Render the form inside `<Suspense>`, because it uses `useSearchParams`, which Next 14 requires to be wrapped.
- [ ] **Step 3:** Build `ResetPasswordForm`:
  - Read `token` from `useSearchParams()`. If it's missing or doesn't match `/^[0-9a-f]{64}$/`, show `resetPassword.invalidLink` with a link to `/forgot-password` and skip the form.
  - Fields: new password and confirmation. Reuse the rules in `@/utils/validation`: at least 8 characters, which is stricter than the API's 6, and the two fields must match.
  - On submit, call `AuthService.resetPassword`. On success, show `resetPassword.success` and redirect to `/login` after about 2 s.
  - On `ApiError` with code `invalid_reset_token`, show `resetPassword.expiredLink` with a link to request a new one.
  - Match the styling of `ForgotPasswordForm`.
- [ ] **Step 4:** Add `"/reset-password"` to the disallow list in `src/app/robots.ts`, next to `/forgot-password`.
- [ ] **Step 5:** Add `resetPassword.*` keys in en and de: `title`, `newPasswordLabel`, `confirmPasswordLabel`, `submit`, `submitting`, `success`, `invalidLink`, `expiredLink`, `requestNewLink`, `backToLogin`.

---

## Task 3: Fix forgot-password

**Files:** `src/components/forms/ForgotPasswordForm.tsx`, `en.json`, `de.json`

- [ ] Replace the inline `fetch` with `AuthService.forgotPassword(email)`.
- [ ] The success message is currently read from `result.message`, but the API returns it at `result.result.message`, so users see an empty message. Show a translated `t("forgotPassword.sent")` instead ("If an account exists for this email, we sent a reset link. It is valid for 60 minutes."), and add the key in en and de.

---

## Task 4: Fix change-password in the profile (it has never worked)

**Why:** `UserProfile.handleChangePassword` calls `fetch("/api/auth/change-password")`. That is a relative URL to the Next.js app, where no such route exists. It also uses `POST`, but the API expects `PUT`, and it reads the token from `localStorage`, but the client stores it in a cookie.

**Files:** `src/services/auth.ts`, `src/components/profile/UserProfile.tsx`, `en.json`, `de.json`

- [ ] Add `AuthService.changePassword(currentPassword, newPassword)`: `apiFetch("auth/change-password", { method: "PUT", headers: { "Content-Type": "application/json", ...getAuthHeaders() }, body })`.
- [ ] Use it in `handleChangePassword`. On success, show `t("profile.passwordChanged")`. On `ApiError` with code `invalid_credentials`, show `t("profile.currentPasswordIncorrect")`; this must not log the user out (see Task 1, Step 1).

---

## Task 5: Tenant ownership in the UI

**Why:** Only the reporter may edit or delete a tenant now. Today anyone can open `/tenant/[id]` and then gets a raw 403 when saving.

**Files:** `src/app/tenant/[id]/TenantEditClient.tsx`, `src/components/forms/TenantEditForm.tsx`, `src/components/common/TenantPreview.tsx`, `en.json`, `de.json`

- [ ] Wrap `TenantEditClient` in `<ProtectedRoute>`.
- [ ] In `TenantEditForm`, after loading the tenant, check whether `tenant.createdById !== user.id`. If so, render `t("editTenant.notOwner")` with a link back instead of the form.
- [ ] Show 403 and 404 from update and delete through `getErrorMessage` (`apiErrors.forbidden`, `apiErrors.not_found`).
- [ ] In `TenantPreview`, show any edit or delete entry point only when `isCurrentUserReporter` is true (that variable already exists).
- [ ] `src/app/tenant/[id]/page.tsx` → `generateMetadata` already checks `res.ok`, so a 404 falls back to the default title. No change is needed there; just verify it.

---

## Task 6: Account deletion and profile

**Files:** `src/components/profile/UserProfile.tsx`, `src/services/user.ts`, `src/types/auth.ts`, `en.json`, `de.json`

- [ ] Update `profile.deleteAccountConfirm` in en and de to say that deleting the account also permanently deletes **all of the user's tenant reports and conversations**.
- [ ] `UpdateUserData` must keep sending only `name`, `surname`, `city`, `country` (and `email`, if editing it is ever added). Any other field is now rejected with 400. Handle `email_already_exists` (409) through `getErrorMessage`.
- [ ] Make `User` and `UserProfile` `name`, `surname`, `city` and `country` `string | null` (the API returns `null` for empty values), and guard where they are displayed.

---

## Task 7: Checks that need no code change

- [ ] `ContactReporterForm` already sends `recipientId: reporter.id`, where `reporter = tenant.createdBy`, which matches the new rule. Just route its errors through `getErrorMessage`.
- [ ] `SearchTenant` already requires a date of birth and sends `YYYY-MM-DD`. Route its errors through `getErrorMessage`.
- [ ] The thread page and conversations page: route 403 and 404 through `getErrorMessage`.
- [ ] `LandlordDetailsClient` calls `GET /users/:id`, which now needs login. The page is already wrapped in `ProtectedRoute`, so it works as is.

---

## Verification

- [ ] `npm run lint` and `npm run build` pass.
- [ ] Run the API locally (`npm run development:local` in `wohnnormade-api`, with `JWT_SECRET` in `environments/.env.local`) and point `NEXT_PUBLIC_API_URL` at it. Then check:
  1. **Expired session:** log in, then change `JWT_SECRET` and restart the API. The next action redirects to `/login?sessionExpired=1` and shows the message.
  2. **Wrong password at login:** shows the translated "invalid email or password" and does **not** redirect.
  3. **Forgot password:** submitting shows the translated "sent" message, for both a known and an unknown email.
  4. **Reset page:** `/reset-password` without a token shows "invalid link". With a valid token the password changes and you can log in with it. Reusing the link shows "expired link".
     - To get a valid token without email, insert a row into `PasswordResetToken` with `tokenHash = sha256(<your 64-hex token>)` and `expiresAt` one hour ahead.
  5. **Change password in the profile:** works. A wrong current password shows the right message and keeps you logged in.
  6. **Ownership:** as user B, opening `/tenant/<A's id>` shows "not owner", with no form.
  7. **Delete account:** the confirmation text mentions reports and conversations. After deleting, you are logged out.
  8. **German:** switch to DE and repeat steps 2–4. No raw keys or English API messages should appear.
- [ ] **Production smoke test after deploy:** log in, search, open a tenant, send a message, and request a reset email. Confirm the email link points to `https://wohnnormade.com/reset-password?...`.
