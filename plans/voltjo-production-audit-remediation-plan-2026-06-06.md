# VoltJo Production Audit Remediation Plan - 2026-06-06

> خطة تفصيلية مبنية على التدقيق الحالي للريبو. هذه الوثيقة لا تنفذ أي تعديل برمجي، بل تجمع ما تم العثور عليه، درجة الخطورة، الأدلة من الملفات، وخطة التصحيح المقترحة للمرحلة القادمة.

## Current Status Note - 2026-06-06

- هذه الوثيقة تاريخية وتحفظ نتائج التدقيق الأصلي؛ لا تعني أن كل البنود أدناه ما زالت بنفس الحالة.
- Phase 5 verified vehicle/station data remains pending, and no fake verified data should be added.
- Cloudflare/OpenNext deployment support was added after Phase 6A.
- Public production remains blocked by verified data, real production operations, and the final launch checklist.

## الخلاصة التنفيذية

VoltJo قريب من بيئة staging من ناحية البنية العامة، لكنه ليس جاهزًا بعد. السبب ليس أن المشروع غير مكتمل بالكامل، بل أن هناك عدة نقاط صغيرة لكنها مؤثرة تجعل اختبار staging غير موثوق إذا تم تجاهلها.

الحكم الحالي:

| البند | الحكم |
| --- | --- |
| Staging-ready | لا، يحتاج إصلاحات محددة قبل نشر staging جاد |
| Public-production-ready | لا |
| أكبر مانع staging | تعطيل geolocation عالميًا رغم أن خريطة الشحن تعتمد عليه |
| أكبر مانع public production | بيانات السيارات ومحطات الشحن ما زالت غير موثقة أو غير موجودة |
| AI launch | غير جاهز، ويجب أن يبقى `AI_PROVIDER=mock` |
| Payment/pricing launch | غير جاهز |

الاختبارات الآمنة التي تم تشغيلها أثناء التدقيق:

| الأمر | النتيجة |
| --- | --- |
| `npm test` | نجح، 3 ملفات اختبار، 24 اختبار |
| `npm run lint` | نجح بدون warnings |
| `npm run build` | نجح، Next.js build اكتمل |
| `git status --short` | نظيف |

## ماذا يعني الحكم عمليًا؟

المشروع مناسب كبنية MVP داخلية بعد إصلاحات staging المحددة. لكنه غير مناسب لإطلاق عام لأن صفحات عامة تعرض وعودًا منتجية حقيقية، بينما:

- بيانات السيارات كلها `estimate`.
- جدول محطات الشحن موجود لكنه فارغ.
- المساعد ما زال mock.
- لا يوجد CSP.
- لا توجد صفحات قانونية عامة واضحة للخصوصية والشروط.
- يوجد UI يعرض Google/GitHub OAuth و Gemini/Kimi رغم أن هذه القدرات ليست جاهزة أو مفعلة بوضوح.

## ما هو جاهز الآن

هذه النقاط جيدة ويجب الحفاظ عليها:

- CI scripts موجودة: `test`, `lint`, `build`.
- GitHub Actions تشغل `npm test`, `npm run lint`, `npm run build`.
- حماية `/account` و`/dashboard` موجودة عبر `proxy.ts`، والصفحات نفسها تعيد التوجيه إذا لم يوجد user.
- Auth callback يستخدم safe redirect validation.
- Supabase RLS موجود على الجداول الحساسة.
- لا يوجد `service_role` في runtime code.
- لا يوجد `dangerouslySetInnerHTML` أو `eval` في runtime surfaces التي تم فحصها.
- API responses غالبًا ترجع رسائل عربية آمنة ولا تعرض stack traces.
- Avatar upload فيه allow-list و magic-byte validation.
- Account export يستخدم whitelist للحقول ولا يعمل broad dump.
- Location save endpoint يتحقق من auth و consent و lat/long ranges.
- AI provider يرجع mock دائمًا حتى لو `AI_PROVIDER` كان `openai` أو `gemini` أو `kimi`.
- Vehicle and charging data docs توضح أن verified seed ما زال غير موجود.

## ما ليس جاهزًا

- staging لا يجب أن يبدأ قبل إصلاح geolocation header أو تعطيل تجربة location في الخريطة.
- public launch لا يجب أن يبدأ قبل بيانات سيارات موثقة ومحطات شحن موثقة.
- OAuth لا يجب أن يظهر للمستخدم إذا لم تكن Google/GitHub providers مفعلة ومجربة.
- أسماء Gemini و Kimi لا يجب أن تظهر في واجهة عامة بينما كل شيء فعليًا mock.
- pricing لا يجب أن يقدم أرقامًا كأنها أسعار إطلاق فعلية إذا الدفع غير مفعّل.
- legal/privacy surface غير كاف لإطلاق عام فيه حسابات، صور، محادثات، و location.
- monitoring و CSP و bot protection غير مكتملة للإطلاق العام.

## جدول النتائج التفصيلي

| Severity | Area | Issue | Evidence | Impact | Recommended fix |
| --- | --- | --- | --- | --- | --- |
| P1 high | Location / security headers | `Permissions-Policy` يعطل geolocation عالميًا بينما خريطة الشحن تطلب الموقع. | `next.config.ts:17-18`, `components/vehicles/ChargingMapClient.tsx:196-206`, `components/vehicles/ChargingMapClient.tsx:381-387` | تجربة تحديد الموقع في `/charging-map` ستفشل أو تبدو مكسورة، وهذا يمنع staging smoke test موثوق. | اسمح بـ geolocation للـ self أو طبقه route-level على `/charging-map` فقط، مع إبقاء consent flow. |
| P0 launch blocker | Vehicle data | بيانات السيارات seeded كلها تقديرية وليست verified. | `supabase/migrations/005_supported_vehicles_mvp.sql:48`, `supabase/migrations/005_supported_vehicles_mvp.sql:259-264`, `docs/staging-smoke-tests.md:51-53` | لا يمكن إطلاق public claims عن السيارات أو الاعتماد عليها في AI أو الحاسبات. | أضف migration جديد لبيانات verified بعد مراجعة بشرية، مع source و confidence واضح. |
| P0 launch blocker | Charging stations | `charging_locations` table موجود لكنه لا يحتوي seed verified. | `supabase/migrations/005_supported_vehicles_mvp.sql:64-80`, `docs/staging-smoke-tests.md:61` | خريطة الشحن تصبح واجهة فارغة أو غير مفيدة إطلاقًا. | جهز seed لمحطات شحن موثقة أو اخف الخريطة من navigation العام حتى تتوفر بيانات. |
| P1 high | Chat API resilience | `/api/chat` يقرأ JSON قبل rate limiting ويعتمد على `Content-Length` فقط للحجم. | `app/api/chat/route.ts:65-96`, `app/api/chat/route.ts:108-117` | طلبات anonymous كبيرة أو chunked قد تستهلك memory قبل وصول rate limit. | طبق IP rate limit قبل body parsing، وأضف body size enforcement لا يعتمد فقط على `Content-Length`. |
| P1 high | Avatar upload safety | avatar route يستخدم `request.formData()` بعد guard مبني على `Content-Length` فقط. | `app/api/account/avatar/route.ts:94-101`, `app/api/account/avatar/route.ts:144` | upload ضخم بدون `Content-Length` قد يستهلك memory. | طبق حد حجم فعلي قبل/أثناء parsing أو استخدم platform body limit واضح. |
| P1 high | Avatar MIME correctness | route يقبل JPG/PNG/WEBP لكنه يرفع كل الملفات كـ `.webp` و `contentType: image/webp` بدون transcode. | `app/api/account/avatar/route.ts:154-158`, `app/api/account/avatar/route.ts:217-230` | صور JPEG/PNG قد تخزن bytes غير WebP مع content type WebP، وهذا قد يسبب عرض خاطئ أو cache/content mismatch. | إما احفظ الامتداد والـ MIME الحقيقي، أو أضف transcode حقيقي إلى WebP. |
| P1 high | Public AI/provider UI | واجهة chat تعرض Gemini و Kimi AI، لكن provider يرجع mock دائمًا. | `components/chat/ChatShell.tsx:41-56`, `lib/ai/provider.ts:12-16`, `docs/staging-smoke-tests.md:174-175` | تسريب provider names ووعد مضلل للمستخدم. | اعرض خيار VoltJo mock فقط حتى real AI launch، أو gate الخيارات خلف feature flag غير public. |
| P1 high | OAuth UX | أزرار Google/GitHub ظاهرة في onboarding رغم أن docs تقول لا تفعل OAuth إلا إذا credentials staged. | `components/onboarding/OnboardingAuthPanel.tsx:196-219`, `docs/staging-smoke-tests.md:80-81` | المستخدم قد يضغط مسار OAuth غير مهيأ، مما يسبب فشل onboarding. | اخف أزرار OAuth خلف config واضح أو احذفها مؤقتًا حتى يتم إعداد providers. |
| P1 high | CSP / monitoring / bot protection | headers الأساسية موجودة، لكن CSP غير موجود، والمراقبة والبوت protection غير مفعلة. | `next.config.ts:3-24`, `README.md:160-163`, `docs/monitoring.md:3-5` | مقبول داخليًا، غير كافٍ public production. | أضف CSP report-only ثم enforce، وفعل Sentry/Vercel monitoring، وأضف bot protection للـ auth/chat. |
| P1 high | Legal/privacy | لا توجد routes عامة واضحة للـ privacy/terms رغم جمع بيانات حساسة نسبيًا. | `app/account/page.tsx:85-88`, `app/api/account/export/route.ts:61-64`, `app/api/account/export/route.ts:88-92`, `components/layout/Footer.tsx:5-12` | launch قانونيًا وعمليًا غير ناضج. | أضف Privacy Policy و Terms و Data Deletion page بالعربية، واربطها في footer/onboarding/account. |
| P2 medium | Location API abuse | location save endpoint ليس عليه rate limiting. | `app/api/account/location-preferences/route.ts:23-100` | مستخدم signed-in يمكنه spam profile updates. | أضف user-scoped rate limit مشابه للـ export/password reset. |
| P2 medium | Server logging privacy | account export يسجل raw Supabase error message server-side. | `app/api/account/export/route.ts:48-58` | logs قد تحتوي تفاصيل backend غير ضرورية. | سجل query و user id و code فقط، أو sanitise message. |
| P2 medium | README drift | README قديم جزئيًا مقارنة بالكود الحالي. | `README.md:152-160`, `README.md:177`, `lib/server/rate-limit.ts:5-8`, `lib/chat/server-persistence.ts:51-127` | deployer قد يقرأ معلومات غير دقيقة عن chat persistence/rate limiting. | حدث README بعد إصلاحات المرحلة القادمة. |
| P2 medium | Pricing claims | pricing يعرض أرقام Plus/Pro رغم أن الدفع غير مفعل. | `components/ui/pricing.tsx:37-42`, `components/ui/pricing.tsx:55-63`, `components/ui/pricing.tsx:165-166`, `components/ui/pricing.tsx:318-319` | يمكن أن تبدو كوعود تسعير فعلية قبل جاهزية payment/legal. | اجعلها "خطط تمهيدية" بدون أرقام نهائية، أو أخف القسم من public launch. |
| Info | Tests | الاختبارات تغطي pure logic فقط وليس route handlers أو Supabase flows. | `lib/ai/validation.test.ts`, `lib/auth/redirect.test.ts`, `lib/vehicles/charging-calculations.test.ts` | CI جيد، لكن regression coverage محدود. | أضف tests للـ API handlers أو integration smoke tests للـ staging. |

## خطة التنفيذ المقترحة

هذه الخطة مرتبة بحيث تصلح staging أولًا، ثم hardening، ثم public launch.

## Phase 1 - Staging Gate Fixes

### الهدف

جعل staging قابلًا للاختبار بدون مسارات UI مكسورة أو وعود provider غير صحيحة.

### العمل المطلوب

1. إصلاح `Permissions-Policy`.
   - الملف المتوقع: `next.config.ts`.
   - الوضع الحالي: `geolocation=()` يمنع كل geolocation.
   - المطلوب: السماح بالـ geolocation للـ self أو تطبيق headers مختلفة حسب route إن أمكن.
   - قبول: زر "تفعيل موقعي" في `/charging-map` يستطيع طلب صلاحية المتصفح.

2. إخفاء OAuth غير المجهز.
   - الملفات المتوقعة:
     - `components/onboarding/OnboardingAuthPanel.tsx`
     - ربما `.env.example` لو سيتم استخدام feature flag.
   - المطلوب: لا تظهر Google/GitHub buttons إلا إذا config صريح مفعّل.
   - قبول: onboarding email/password يبقى يعمل، ولا يظهر OAuth في staging إذا لم يتم إعداده.

3. إخفاء أسماء providers غير launched.
   - الملفات المتوقعة:
     - `components/chat/ChatShell.tsx`
     - `components/chat/ChatComposer.tsx`
     - `components/chat/ChatTopBar.tsx`
   - المطلوب: عرض "VoltJo" أو "VoltJo التجريبي" فقط.
   - قبول: لا يظهر `Gemini`, `Kimi`, `OpenAI`, `provider`, `mock` في UI العام.

4. تحديث smoke checklist.
   - الملف المتوقع: `docs/staging-smoke-tests.md`.
   - المطلوب: أضف check صريح لـ geolocation header و OAuth hidden state و provider names.

### Acceptance criteria

- `npm test` ينجح.
- `npm run lint` ينجح.
- `npm run build` ينجح.
- `/charging-map` يطلب geolocation من المتصفح.
- `/start` لا يعرض OAuth غير مفعّل.
- `/assistant` لا يعرض Gemini/Kimi/OpenAI/provider names.

### Prompt جاهز للتنفيذ

```text
Fix staging blockers only. Do not touch vehicle data or public/cars.

1. Update security headers so geolocation works for the charging map while keeping camera and microphone disabled.
2. Hide Google/GitHub OAuth buttons unless an explicit public feature flag enables them.
3. Hide Gemini/Kimi model choices while AI_PROVIDER must remain mock.
4. Update docs/staging-smoke-tests.md with the new checks.

Run npm test, npm run lint, npm run build.
```

## Phase 2 - API Body Size and Abuse Hardening

### الهدف

تقليل مخاطر resource abuse على `/api/chat` و avatar upload.

### العمل المطلوب

1. نقل rate limit في `/api/chat` قبل `request.json()`.
   - الملف: `app/api/chat/route.ts`.
   - المشكلة: الجسم يقرأ قبل rate limit.
   - المطلوب: استخرج IP ثم طبق anonymous/user rate limit بأقل قراءة ممكنة.
   - ملاحظة: إذا user يحتاج Supabase lookup، يمكن تطبيق IP pre-limit للـ anonymous قبل parsing ثم user limit بعد auth.

2. إضافة body size guard فعلي.
   - الملفات:
     - `app/api/chat/route.ts`
     - `app/api/account/avatar/route.ts`
   - المشكلة: `Content-Length` ممكن يكون مفقودًا.
   - المطلوب: لا تعتمد فقط على header. استخدم platform/runtime config إن أمكن أو read-limited stream helper.

3. تصحيح avatar MIME.
   - الملف: `app/api/account/avatar/route.ts`.
   - الخيار A: تخزين حسب النوع:
     - JPG: `.jpg`, `image/jpeg`
     - PNG: `.png`, `image/png`
     - WEBP: `.webp`, `image/webp`
   - الخيار B: إضافة transcode حقيقي إلى WebP.
   - للـ MVP: الخيار A أبسط وأقل مخاطرة.

4. إضافة rate limit إلى location preferences.
   - الملف: `app/api/account/location-preferences/route.ts`.
   - limit مقترح: 10 requests لكل user كل 10 دقائق.

### Acceptance criteria

- oversized chat returns 413 قبل work ثقيل.
- invalid JSON still returns safe Arabic 400.
- anonymous chat فوق الحد returns 429.
- avatar oversized/chunked abuse لا يقرأ payload غير محدود.
- JPEG/PNG/WEBP avatars تعرض بمحتوى و content type صحيحين.
- location save فوق الحد returns 429.

### Prompt جاهز للتنفيذ

```text
Harden API body parsing and abuse protection.

Focus files:
- app/api/chat/route.ts
- app/api/account/avatar/route.ts
- app/api/account/location-preferences/route.ts

Do:
- Add an IP pre-rate-limit before chat body parsing.
- Enforce request body size without trusting Content-Length alone.
- Preserve all Arabic safe error responses.
- Fix avatar storage MIME/extension mismatch without adding image transcoding unless absolutely needed.
- Add user-scoped rate limiting to location-preferences.

Do not change AI_PROVIDER behavior. Do not add packages unless there is no built-in option.
Run npm test, npm run lint, npm run build.
```

## Phase 3 - Public UI Truthfulness Pass

### الهدف

إزالة أي وعد public يوحي بميزات غير جاهزة.

### العمل المطلوب

1. Assistant section copy.
   - الملف: `components/sections/AiAssistantSection.tsx`.
   - المشكلة: النص يصف قدرات متقدمة: "يحسب ويقارن"، "يعطي توصية"، "يفهم سياق الأردن".
   - المطلوب: صياغة أوضح بأنه مساعد إرشادي تجريبي يعتمد على بيانات أولية.

2. Pricing section.
   - الملف: `components/ui/pricing.tsx`.
   - المطلوب:
     - إزالة أرقام 4.99 و 9.99 من public launch أو وضع label واضح "تمهيدي".
     - إبقاء CTAs غير payment.
     - إضافة ملاحظة أن الاشتراكات غير مفعلة.

3. Announcement bar.
   - الملف: `components/layout/AnnouncementBar.tsx`.
   - المشكلة: "أصبحت جاهزة للإطلاق" قد تتعارض مع estimate data.
   - المطلوب: "قاعدة السيارات التجريبية قيد المراجعة" أو صياغة مشابهة.

4. Vehicles page.
   - الملفات:
     - `app/vehicles/page.tsx`
     - `app/vehicles/[slug]/page.tsx`
   - المطلوب:
     - إظهار `estimate` بوضوح.
     - منع أي wording يوحي أن البيانات نهائية.

### Acceptance criteria

- لا توجد provider names في runtime UI.
- لا توجد "جاهزة للإطلاق" لبيانات estimate.
- pricing واضح أنه غير مفعّل.
- vehicle pages واضحة أن البيانات تقديرية.

## Phase 4 - Legal and Privacy Readiness

### الهدف

إضافة minimal legal/privacy surface قبل public launch.

### صفحات مقترحة

1. `/privacy`
   - ما يتم جمعه:
     - email
     - Smart Profile answers
     - chat messages
     - avatar path/public avatar
     - optional browser location إذا المستخدم وافق على الحفظ
   - لماذا يجمع:
     - account
     - personalization
     - assistant
     - charging map
   - ما لا يتم جمعه:
     - passwords داخل VoltJo
     - payment data، لأن الدفع غير مفعل
     - real AI provider processing في هذه المرحلة، لأن AI mock
   - retention:
     - account data until deletion request
     - chat export/deletion policy
   - contact:
     - support email رسمي.

2. `/terms`
   - المنصة معلوماتية وليست استشارة قانونية/مالية/فنية نهائية.
   - بيانات السيارات والشحن قد تكون تقديرية.
   - المستخدم يجب أن يتحقق من الوكيل/الشركة/المصدر الرسمي.
   - لا توجد مدفوعات حاليًا.
   - AI mock في هذه المرحلة.

3. `/data-deletion`
   - شرح طريقة طلب حذف الحساب.
   - ربط مع `components/account/DeleteAccountRequest.tsx`.
   - SLA داخلي مقترح: 7 إلى 14 يوم عمل.

### ملفات متوقعة

- `app/privacy/page.tsx`
- `app/terms/page.tsx`
- `app/data-deletion/page.tsx`
- `components/layout/Footer.tsx`
- `app/robots.ts`
- `app/sitemap.ts`

### Acceptance criteria

- الروابط ظاهرة في footer.
- الصفحات Arabic-first.
- لا توجد وعود قانونية مبالغ فيها.
- sitemap يحتوي الصفحات العامة.
- robots لا يحجب الصفحات القانونية.

## Phase 5 - Verified Data Gate

### الهدف

تحويل VoltJo من demo data إلى public credible MVP.

### ما يجب التحقق منه للسيارات

لكل سيارة يتم إطلاقها public:

- brand
- model
- model year
- vehicle type: EV/PHEV/HEV
- battery kWh إن وجدت
- engine/fuel tank إن وجدت
- electric range إن وجد
- charging port
- DC fast charging support
- home charging support
- Jordan availability note
- official/dealer source
- confidence level
- last verified date

### ما يجب التحقق منه لمحطات الشحن

لكل station:

- name_ar
- name_en إن وجد
- city
- area
- latitude
- longitude
- plug_types
- power_kw إن وجد
- is_verified = true فقط إذا تم التحقق
- source
- notes_ar
- last verified date، إذا أضيف column لاحقًا

### SQL plan

لا تعدل migration `005`. أضف migration جديد:

```text
supabase/migrations/007_verified_launch_data.sql
```

أو إذا أردت فصلها:

```text
supabase/migrations/007_verified_vehicles_seed.sql
supabase/migrations/008_verified_charging_locations_seed.sql
```

### قواعد مهمة

- لا تستخدم public/cars كمصدر launch data بدون مراجعة بشرية.
- لا seed لمحطة شحن غير موثقة.
- لا تغير `data_confidence` إلى `official` إلا بوجود مصدر رسمي.
- إذا مصدر dealer، استخدم `dealer`.
- إذا مصدر مالك سيارة، استخدم `owner_reported`.
- إذا غير مؤكد، اتركه `estimate` ولا تستخدمه في claims قوية.

### Acceptance criteria

- `/vehicles` يعرض فقط سيارات launch verified أو يوضح estimate بوضوح.
- `/charging-map` يعرض stations موثقة أو empty state صادق.
- no fake data.
- docs تحدد أن migration 007 موجود وتم تشغيله.

## Phase 6 - CSP, Monitoring, and Bot Protection

### الهدف

رفع جاهزية public production أمنيًا وتشغيليًا.

### CSP

ابدأ بـ report-only:

- `default-src 'self'`
- `script-src` مضبوط حسب Next/runtime
- `style-src` يأخذ Google Fonts/inline needs بعناية
- `img-src` يسمح Supabase storage و data/blob إذا لازم
- `connect-src` يسمح Supabase و Upstash إذا يحتاج client، وغالبًا Upstash server-only
- MapLibre tile/style hosts حسب المصدر المستخدم

ثم enforce بعد أسبوع مراقبة.

### Monitoring

المقترح:

- Sentry أو Vercel Observability.
- server-side errors.
- client-side errors.
- source maps بطريقة لا تكشف tokens.

### Bot protection

المناطق المهمة:

- signup
- login
- `/api/chat`
- avatar upload

خيارات:

- Turnstile
- hCaptcha
- Vercel WAF/rules
- rate limiting الحالي يبقى طبقة أولى وليس الوحيدة.

### Acceptance criteria

- 500s تظهر في monitoring.
- client-side errors تظهر في monitoring.
- CSP report-only لا يسبب كسر واضح.
- bot protection لا يكسر Arabic onboarding.

## Phase 7 - Docs Cleanup and Deployment Runbook

### الهدف

جعل الوثائق مطابقة للكود الحالي.

### تحديثات مطلوبة

1. `README.md`
   - إزالة أي كلام يقول إن rate limiter in-memory إذا لم يعد صحيحًا.
   - توضيح أن Upstash مطلوب.
   - توضيح أن chat persistence server-side موجود لكن UI قد يبقى local-first حسب الحالة.
   - إضافة legal pages بعد إنشائها.
   - إضافة geolocation header decision.

2. `docs/staging-smoke-tests.md`
   - إضافة checks:
     - geolocation works.
     - OAuth hidden or configured.
     - no provider names.
     - pricing clearly preliminary.
     - legal links exist before public launch.

3. `plans/voltjo-production-readiness-plan.md`
   - لا تعدله فورًا إذا كان historical.
   - لاحقًا يمكن إضافة note في أعلى الملف يشير إلى هذه الوثيقة الأحدث.

### Acceptance criteria

- لا توجد تناقضات واضحة بين README والكود.
- staging operator يعرف ترتيب migrations و env vars و manual Supabase setup.
- public launch checklist واضح ومفصول عن staging checklist.

## Minimum checklist before staging

هذه هي القائمة المختصرة التي يجب إنجازها قبل staging حقيقي:

- [ ] إصلاح geolocation policy.
- [ ] إخفاء OAuth إذا غير مهيأ.
- [ ] إخفاء Gemini/Kimi/provider names.
- [ ] التأكد أن `AI_PROVIDER=mock`.
- [ ] ضبط Supabase env:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SITE_URL`
- [ ] ضبط Upstash env:
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
- [ ] تشغيل migrations بالترتيب:
  - `supabase/schema.sql`
  - `001_chat_persistence.sql`
  - `002_account_settings.sql`
  - `003_profile_avatar_path.sql`
  - `004_avatar_storage_policies.sql`
  - `005_supported_vehicles_mvp.sql`
  - `006_user_location_preferences.sql`
- [ ] إنشاء bucket باسم `avatars`.
- [ ] إعداد Supabase Auth URLs:
  - `/auth/callback`
  - `/auth/update-password`
- [ ] تشغيل smoke tests من docs.
- [ ] `npm test`, `npm run lint`, `npm run build` جميعها ناجحة.

## Minimum checklist before public launch

- [ ] بيانات سيارات verified.
- [ ] محطات شحن verified أو إخفاء map كميزة عامة.
- [ ] Legal pages:
  - `/privacy`
  - `/terms`
  - `/data-deletion`
- [ ] support email رسمي يعمل.
- [ ] production SMTP configured.
- [ ] CSP report-only ثم enforce.
- [ ] monitoring مفعل.
- [ ] bot protection مفعل أو WAF rules.
- [ ] pricing لا يعرض أرقام نهائية إلا بقرار business.
- [ ] لا real AI provider.
- [ ] لا provider names في UI.
- [ ] two-user RLS test.
- [ ] staging smoke tests كاملة.
- [ ] rollback plan واضح.

## ترتيب الأولوية المقترح

1. Staging blockers:
   - geolocation policy
   - OAuth visibility
   - provider names

2. API hardening:
   - chat pre-rate-limit
   - body size enforcement
   - avatar MIME correctness
   - location rate limit

3. Public truthfulness:
   - announcement wording
   - assistant wording
   - pricing wording
   - vehicles estimate wording

4. Legal:
   - privacy
   - terms
   - deletion
   - footer links

5. Verified data:
   - vehicle verification
   - charging station verification
   - migration 007

6. Production ops:
   - CSP
   - monitoring
   - bot protection
   - docs cleanup

## Risks by area

### Backend/API

الخطر الأكبر ليس secret leakage، بل resource abuse بسبب parsing قبل rate limiting واعتماد الحجم على `Content-Length`.

### Supabase

RLS جيد، لكن الإطلاق يعتمد على manual setup. أي migration ناقص سيؤدي إلى failure في avatar/account/chat/location.

### Data

البيانات هي أكبر مانع public launch. لا يمكن تعويض ذلك بالكود.

### Frontend/UI

الواجهة جميلة وواضحة، لكن بعض العبارات قد تعد المستخدم بقدرات غير موجودة بعد.

### Security

الأساس جيد، لكن public launch يحتاج CSP/monitoring/bot protection.

### Legal/privacy

الحسابات والمحادثات والموقع الاختياري تعني أن privacy/terms ليست اختيارية للإطلاق العام.

## Definition of done لكل مرحلة

### Staging ready

VoltJo يعتبر staging-ready عندما:

- كل P1 staging blockers مغلقة.
- staging smoke tests تمر.
- لا يوجد provider/OAuth UI غير مهيأ.
- geolocation يعمل.
- mock AI مؤكد.
- CI ناجح.

### Public production ready

VoltJo يعتبر public-production-ready عندما:

- كل P0 مغلق.
- legal/privacy pages موجودة.
- verified data موجودة.
- monitoring و CSP و bot protection موجودة.
- SMTP/Auth production جاهز.
- pricing/payment copy واضح.
- smoke tests + RLS tests ناجحة.

## ملاحظات مهمة

- لا تطلق real AI قبل verified vehicle/station data.
- لا تضف `OPENAI_API_KEY`, `GEMINI_API_KEY`, أو `KIMI_API_KEY` للـ launch الحالي.
- لا تستخدم `service_role` في runtime.
- لا تلمس `public/cars` كجزء من هذه الخطة إلا للقراءة والتحقق البشري.
- لا تعدل migrations القديمة بعد تطبيقها؛ أضف migrations جديدة فقط.
- لا seed بيانات وهمية لمحطات الشحن.

## النتيجة النهائية

المشروع ليس بعيدًا عن staging، لكنه يحتاج إصلاحات truthfulness و geolocation و OAuth/provider UI أولًا. أما public production فممنوع عمليًا قبل verified data، legal/privacy، monitoring، CSP، وbot protection.

الأولوية الصحيحة الآن ليست إضافة ميزات جديدة، بل إغلاق التناقضات بين ما تقوله الواجهة وما يستطيع backend/data layer دعمه فعليًا.
