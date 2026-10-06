# Investigation: POST /api/auth/forgot/request — 500 Internal Server Error

## Summary (Root Cause First)

The 500 is thrown by the **Next.js API route** (`frontend/app/api/auth/forgot/request/route.ts`) when it calls **Resend** to send the OTP email. The call fails because `RESEND_FROM_EMAIL` is set to `no-reply@alsharihaa.com`, but the Resend account has **not verified that domain** (or the domain spelling is inconsistent), causing Resend to reject the send and throw an error — which the route catches and returns as a 500.

There is a **secondary candidate**: the frontend `.env.local` sets `BACKEND_URL=https://alshareehasim-backend.onrender.com` (the production Render instance), so when running locally the Next.js BFF calls the live backend, not `localhost:5000`. If that production backend is sleeping (Render free tier spins down) or unavailable, the `fetch()` to it will time out or throw a network error — also caught and returned as a 500.

---

## Evidence

### 1. The failing route — `frontend/app/api/auth/forgot/request/route.ts`

```
import { sendEmail } from "../../../../lib/resendClient";
import { otpEmailTemplate } from "../../../../lib/otpTemplate";

const BACKEND = process.env.BACKEND_URL || "http://localhost:5000";

export async function POST(req: NextRequest) {
  // 1. Calls backend to generate OTP
  const backendRes = await fetch(`${BACKEND}/api/customers/auth/forgot/request`, …);
  …
  const otp: string = backendData._otp;
  if (!otp) { return 500 "خطأ في إنشاء الرمز" }

  // 2. Sends email via Resend — this is the failure point
  try {
    await sendEmail({ to: email, subject: "…", html: otpEmailTemplate(otp) });
  } catch {
    return NextResponse.json({ error: "فشل إرسال بريد التحقق" }, { status: 500 }); ← 500
  }
```

File: `frontend/app/api/auth/forgot/request/route.ts`

### 2. Resend client — `frontend/app/lib/resendClient.ts`

```typescript
const from = `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL || "no-reply@alshariha.com"}>`;
const { error } = await resend.emails.send({ from, to, subject, html });
if (error) throw new Error(error.message);   // ← throws, caught by the route's catch block
```

The `from` address is built from `RESEND_FROM_EMAIL`. The `.env.local` sets this to `no-reply@alsharihaa.com`. Resend requires the sending domain to be **verified in the Resend dashboard**. If `alsharihaa.com` is not verified (or if the DNS records haven't propagated), Resend returns an error, `sendEmail` throws, and the route returns 500.

Note the **domain spelling inconsistency** across the codebase:
- `.env.local` → `alsharihaa.com` (8 chars in "alsharihaa")
- `resendClient.ts` fallback → `alshariha.com` (7 chars)
- Site URL → `alshareehanet.com`
- Backend URL → `alshareehasim-backend.onrender.com`

None of these spellings match each other. If the domain verified in Resend is `alshariha.com` (the fallback) but `.env.local` overrides it to `alsharihaa.com` (unverified), every send fails.

### 3. `BACKEND_URL` points to production when running locally

`frontend/.env.local` line 27:
```
BACKEND_URL=https://alshareehasim-backend.onrender.com
```

The Next.js API route uses `process.env.BACKEND_URL || "http://localhost:5000"`, so locally it hits the **Render production backend**, not a local server. If Render is on the free tier it sleeps after 15 minutes of inactivity; the cold-start fetch can exceed the default fetch timeout and throw, returning 500 with message "خطأ في الخادم".

### 4. Backend route is correctly registered

`backend/server.js` mounts `customerRoutes` at `/api/customers`:
```js
const customerRoutes = require("./routes/customerRoutes");
app.use("/api/customers", customerRoutes);
```

`backend/routes/customerRoutes.js` line 427:
```js
router.post("/auth/forgot/request", otpLimiter, async (req, res) => { … });
```

Full path: `POST /api/customers/auth/forgot/request` — correctly called by the Next.js BFF. ✓

### 5. Backend OTP handler logic (does NOT send email itself)

The backend generates the OTP, saves it hashed to MongoDB, and returns `{ _otp: otp }` in plain text to the BFF (Next.js). **Email is sent exclusively by the frontend BFF**, not the backend. The backend has no SMTP/email config and needs none. This is intentional.

### 6. Backend `.env` keys present

Keys present: `PORT`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `JWT_SECRET`, `FRONTEND_URL`, `MONGO_URI`, `OTP_HASH_SECRET`, `INTERNAL_SECRET`.

No SMTP or email keys — expected, because email is handled by the Next.js BFF via Resend.

### 7. Frontend `.env.local` email-related keys present

- `RESEND_API_KEY` — present ✓
- `RESEND_FROM_EMAIL` — present (`no-reply@alsharihaa.com`) ✓
- `RESEND_FROM_NAME` — present ✓

All keys exist. The issue is not a missing key, it is a **domain verification problem** or **domain name mismatch**.

### 8. Backend server.log

```
Server running on port 5000
MongoDB connected
```

No errors in the log — the backend itself is healthy. This confirms the 500 originates in the Next.js layer (port 3000), not the Express backend (port 5000).

### 9. No frontend Next.js error log found

No Next.js `.log` file exists under `frontend/`. The error message "فشل إرسال بريد التحقق" is only visible in the route's catch block — to see the Resend error detail you need to check the Next.js server terminal output.

---

## Conclusions

| # | Finding | Confidence |
|---|---------|-----------|
| 1 | **Primary:** Resend rejects sends from `no-reply@alsharihaa.com` because the domain is not verified or the spelling doesn't match the verified domain | High |
| 2 | **Secondary:** `BACKEND_URL` points to production Render, causing cold-start timeouts locally | Medium |
| 3 | The backend OTP route is correctly implemented and registered — no backend bug | High |
| 4 | Domain name inconsistency (`alsharihaa.com` vs `alshariha.com` vs `alshareehanet.com`) is a latent bug regardless | Confirmed |

---

## Recommendations (do not implement, investigation only)

### Fix 1 — Verify the correct sending domain in Resend (PRIMARY FIX)

1. Log into the Resend dashboard and check which domain is verified.
2. Update `RESEND_FROM_EMAIL` in `frontend/.env.local` (and in the production deployment's env vars) to use exactly the verified domain name.
3. If no domain is verified yet, verify `alsharihaa.com` via DNS TXT record in Resend, or use Resend's shared `onboarding@resend.dev` domain temporarily for development.

### Fix 2 — Add error detail logging in `register/request/route.ts` and `forgot/request/route.ts`

The `forgot/request` route's catch block swallows the Resend error:
```typescript
} catch {
  return NextResponse.json({ error: "فشل إرسال بريد التحقق" }, { status: 500 });
}
```
Change to log the error so you can see the actual Resend rejection reason in the Next.js terminal:
```typescript
} catch (emailErr: unknown) {
  const msg = emailErr instanceof Error ? emailErr.message : String(emailErr);
  console.error("forgot/request sendEmail error:", msg);
  return NextResponse.json(
    { error: "فشل إرسال بريد التحقق", detail: process.env.NODE_ENV !== "production" ? msg : undefined },
    { status: 500 }
  );
}
```
(The `register/request/route.ts` already does this — apply the same pattern to `forgot/request/route.ts`.)

### Fix 3 — Use `localhost:5000` for local development

Add a `frontend/.env.development.local` (or update `.env.local` for local use) that sets:
```
BACKEND_URL=http://localhost:5000
```
This prevents the cold-start timeout issue when developing locally with a running local backend.

### Fix 4 — Standardize domain spelling

Audit all occurrences of `alsharihaa`, `alshariha`, `alshareeha`, and `alshareehanet` across the codebase and settle on one canonical domain name. The inconsistency currently exists in at minimum: `.env.local`, `resendClient.ts` (fallback), `middleware.ts` (CSP), `app/lib/api.ts`, and several admin constants files.
