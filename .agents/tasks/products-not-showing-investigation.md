# تحقيق: المنتجات لا تظهر في الموقع

**التاريخ:** 2025  
**الحالة:** مكتمل — تم تحديد السبب الجذري

---

## الملخص التنفيذي (الإجابة المباشرة)

**السبب الجذري الرئيسي:** الـ Backend URL في `.env.local` هو `https://alshareehasim-backend.onrender.com`، لكن `app/lib/api.ts` يحتوي على قائمة بيضاء (`ALLOWED_HOSTS`) لا تضم هذا الدومين — تحديداً `onrender.com`. عندما يحاول الكود على الـ client-side استخدام `getApiBase()`، يفشل فحص الـ host ويعود بـ `""` (سلسلة فارغة)، ما يعني أن الـ fetch يُرسل لـ `/api/products` بدلاً من `https://alshareehasim-backend.onrender.com/api/products`. هذا لا يُسبب خطأً صريحاً لأنه يُرسَل للـ Next.js proxy، لكن هناك مشكلة ثانية في الـ proxy نفسه.

**السببان الجذريان بالترتيب:**

1. **`app/lib/api.ts` — `ALLOWED_HOSTS` لا يضم `alshareehasim-backend.onrender.com`** → يؤدي إلى رجوع الدالة بـ `""` أو `"http://localhost:5000"` بدلاً من URL الصحيح.
2. **`MostDemandedSection.tsx` — IDs مشفرة بشكل ثابت (hardcoded) لا تتطابق مع قاعدة البيانات الحالية** → قسم "الأكثر طلباً" يعود فارغاً دائماً ويُخفي نفسه.
3. **`HomeCategorySections.tsx` — يطلب endpoint غير موجود `/api/products/home-sections`** → الـ fallback يعتمد على `/api/admin/brands/home-settings` الذي قد لا يكون مُهيأً، فيُعيد قسم الرئيسية فارغاً.

---

## الأدلة والتفاصيل

### 1. مشكلة `ALLOWED_HOSTS` في `app/lib/api.ts`

**الملف:** `frontend/app/lib/api.ts` (سطر 1–33)

```ts
const ALLOWED_HOSTS = [
  "localhost",
  // ... قائمة من الـ domains
  "alshareehasim-backend.vercel.app",  // ← vercel ✓
  // "alshareehasim-backend.onrender.com"  ← render.com غائب ✗
];

function getApiBase(): string {
  if (typeof window !== "undefined") {
    return "";  // على الـ client دائماً يعود بـ ""
  }
  const raw = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  try {
    const { hostname, origin } = new URL(raw);
    if (!ALLOWED_HOSTS.includes(hostname)) throw new Error(`Blocked host: ${hostname}`);
    return origin;
  } catch {
    return "http://localhost:5000";  // ← يُستخدم localhost بدلاً من onrender!
  }
}
```

**القيمة الفعلية في `.env.local`:**
```
NEXT_PUBLIC_API_URL=https://alshareehasim-backend.onrender.com
BACKEND_URL=https://alshareehasim-backend.onrender.com
```

**النتيجة:** دالة `getApiBase()` تُقيّم hostname = `alshareehasim-backend.onrender.com`، لا تجده في `ALLOWED_HOSTS`، وتُلقي exception داخلي وترجع `"http://localhost:5000"`. كل fetch من الـ server-side يذهب لـ localhost وليس للـ backend الحقيقي.

> ملاحظة: الـ client-side دائماً يُعيد `""` (بصرف النظر عن الـ URL)، وهذا صحيح — يمرر الطلب للـ Next.js proxy routes في `/app/api/`.

---

### 2. `_lib.ts` — الـ Proxy يستخدم نفس `getBackend()` المعطوب

**الملف:** `frontend/app/api/admin/_lib.ts` (سطر 3–8)

```ts
const BACKEND = "https://alshareehaa-backend.vercel.app";  // ← fallback قديم!

export function getBackend(): string {
  return process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || BACKEND;
}
```

هذه الدالة تقرأ `BACKEND_URL` أولاً — وهو موجود في `.env.local` بالقيمة الصحيحة `https://alshareehasim-backend.onrender.com` — لذا **الـ proxy routes يعملون بشكل صحيح** (لأنهم يستخدمون `_lib.ts#getBackend()` وليس `lib/api.ts#getApiBase()`). المشكلة محصورة في `app/lib/api.ts`.

---

### 3. مشكلة `MostDemandedSection.tsx` — IDs مشفرة لا تتطابق

**الملف:** `frontend/app/components/MostDemandedSection.tsx` (سطر 8–12)

```ts
const IDS = [
  "6a943492832465e62427be05",
  "6a9437e6cd7da0bf04e86916",
  "6a9430ba2f39401999e29c50",
  "6a94389df64d29e186524b77",
];
```

هذه IDs بصيغة MongoDB ObjectId، لكنها تبدو **غير صحيحة** — ObjectId الحقيقي يبدأ بـ 24 حرف hex، لكن هذه تبدأ بـ `6a` وليس بـ timestamp حقيقي. إذا لم تكن هذه المنتجات موجودة في قاعدة البيانات، يُعيد الـ endpoint `[]`، والمكون يُخفي نفسه بـ `if (products.length === 0) return null`.

---

### 4. مشكلة `HomeCategorySections.tsx` — Endpoint غير موجود

**الملف:** `frontend/app/components/HomeCategorySections.tsx` (سطر 25)

```ts
const singleRes = await fetch(`${BACKEND}/api/products/home-sections`, { ... });
```

هذا الـ endpoint **غير موجود** في `backend/routes/productRoutes.js`:
```js
router.get("/", getProducts);
router.get("/featured", getFeaturedProducts);
router.get("/by-ids", getProductsByIds);
router.get("/:id", getProduct);
// ← لا يوجد "/home-sections"
```

الكود يفشل ويتحول للـ fallback الذي يستدعي `/api/admin/brands/home-settings`. إذا لم تكن هناك brands مُهيأة بـ `showInHome: true` في قاعدة البيانات، يُعيد القسم فارغاً تماماً.

---

### 5. `CategoryPageClient.tsx` — الـ Client-side Fetch يستخدم `NEXT_PUBLIC_API_URL` مباشرة

**الملف:** `frontend/app/(categories)/[slug]/CategoryPageClient.tsx` (سطر 16)

```ts
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
// ...
fetch(`${API}/api/products${query}`)
```

هذا يتجاوز الـ proxy ويتصل مباشرة بالـ backend من المتصفح. هذا يعمل طالما:
- الـ backend يقبل CORS من دومين الـ frontend
- `NEXT_PUBLIC_API_URL` هو `alshareehasim-backend.onrender.com`

**تحقق من الـ CORS في `backend/server.js`:**
```js
const allowedOrigins = [
  "http://localhost:3000",
  ...(process.env.FRONTEND_URL || "").split(",").map(...)
];
```

**في `backend/.env`:**
```
FRONTEND_URL=https://alshareehasim.com,https://alshareehanet.com,http://localhost:3000
```

الـ backend يقبل `alshareehanet.com` ✓ — لكن إذا كان الموقع يعمل من دومين مختلف، سيُحظر الـ CORS.

---

### 6. `[slug]/page.tsx` — Server-side Fetch يستخدم `BACKEND_URL` (صحيح)

**الملف:** `frontend/app/(categories)/[slug]/page.tsx` (سطر 8–13)

```ts
const BACKEND = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
```

هذا يعمل بشكل صحيح لأن `BACKEND_URL` موجود في `.env.local`، لكن الصفحات مُكيّشة بـ `revalidate: 3600` — لذا إذا كان الـ build الأول فشل في الاتصال بالـ backend، ستبقى الصفحات فارغة حتى إعادة البناء.

---

## ملخص الأسباب

| # | المشكلة | الموقع | الأثر |
|---|---------|---------|-------|
| 🔴 | `ALLOWED_HOSTS` لا يضم `onrender.com` | `app/lib/api.ts` | جميع server-side fetches ترجع من localhost |
| 🔴 | IDs مشفرة لا تتطابق مع DB | `MostDemandedSection.tsx` | قسم "الأكثر طلباً" مخفي دائماً |
| 🟡 | Endpoint `/home-sections` غير موجود | `HomeCategorySections.tsx` | قسم الرئيسية قد يكون فارغاً |
| 🟡 | `_lib.ts` يحتوي على fallback URL قديم | `app/api/admin/_lib.ts` | خطر إذا حُذف `BACKEND_URL` من env |

---

## التوصيات (بدون تنفيذ)

### إصلاح 1 — إضافة `alshareehasim-backend.onrender.com` إلى `ALLOWED_HOSTS` (أولوية قصوى)

في `frontend/app/lib/api.ts`، أضف:
```ts
const ALLOWED_HOSTS = [
  // ... القائمة الحالية
  "alshareehasim-backend.onrender.com",  // ← أضف هذا
];
```

### إصلاح 2 — تحديث IDs في `MostDemandedSection.tsx`

استبدل الـ IDs المشفرة بـ IDs حقيقية من MongoDB Atlas، أو احذف القسم واستبدله بـ `isFeatured: true` query من الـ API.

بديل جاهز: استخدم `/api/products/featured` الموجود بالفعل بدلاً من IDs مشفرة.

### إصلاح 3 — `HomeCategorySections.tsx`: إضافة endpoint `/api/products/home-sections` في الـ backend أو تعديل المكون لاستخدام endpoint موجود

خيار أ: أضف route في `productRoutes.js`:
```js
router.get("/home-sections", getHomeSections);
```

خيار ب: عدّل `HomeCategorySections.tsx` لتخطي الطلب الأول مباشرةً والاعتماد على الـ fallback.

### إصلاح 4 — تحديث fallback في `_lib.ts` (تحسين احترازي)

```ts
const BACKEND = "https://alshareehasim-backend.onrender.com";  // حدّث الـ fallback
```

### إصلاح 5 — التحقق من CORS في الـ backend

تأكد أن دومين الـ frontend الفعلي المستخدم موجود في `FRONTEND_URL` في `.env` الخاص بالـ backend على Render.

---

## خلاصة التشخيص

المشكلة ليست في منطق الـ backend ولا في مخطط البيانات — كلاهما سليم. المشكلة في **طبقة الاتصال**: `app/lib/api.ts` يحجب URL الـ backend الصحيح بسبب قائمة بيضاء قديمة، و`MostDemandedSection` يطلب منتجات بـ IDs غير موجودة، و`HomeCategorySections` يطلب endpoint غير موجود في الـ backend.
