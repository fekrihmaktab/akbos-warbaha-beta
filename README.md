# اكبس واربح — FEKRI GAMES V9.42

## V9.42 — PWA + production deployment preparation

هذه النسخة مبنية على V9.41 المستقرة. لم يتم تغيير قواعد اللعب أو WebSocket أو مدة المباراة.

### ما أضيف
- PWA Service Worker للتثبيت على الهاتف والكمبيوتر عند التشغيل عبر HTTPS.
- أيقونات PNG بحجم 192 و512 للتثبيت.
- `apple-touch-icon` وبيانات PWA محسنة.
- مسار صحة للسيرفر: `/health`.
- heartbeat دوري لاتصالات WebSocket للمساعدة في الحفاظ على الاتصالات الحية.
- معالجة إيقاف السيرفر بشكل منظم عند `SIGTERM`.
- ملف `render.yaml` جاهز للنشر كـ Node Web Service مع WebSocket.

### تشغيل محلي
```powershell
node server.js
```

ثم:
`http://localhost:3000`

### نشر عام
هذه اللعبة تحتاج Web Service حقيقي لأنها تستخدم API + WebSocket. Render يدعم WebSocket وNode Web Services. بعد ربط المستودع، استخدم:
- Build: `npm install`
- Start: `npm start`
- Health check: `/health`

في الإنتاج يستخدم المتصفح `wss://` تلقائيًا لأن عنوان WebSocket يُبنى من نفس عنوان الموقع.

### الحالة
- 1v1 / 2v2 / 3v3: مثبتة حسب اختبار V9.39-V9.41.
- WebSocket: مثبت في الاختبارات المحلية.
- مدة المباراة: 2/3/4/5 دقائق.
- الخطوة التالية بعد النشر التجريبي: قاعدة بيانات وحسابات حقيقية.
