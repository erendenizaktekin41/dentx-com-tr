# dentx.com.tr — Vercel

Statik site + `/api/lead` (randevu ve iletişim formları → info@dentx.com.tr).
Build adımı yok: Vercel'de Framework Preset **Other**.

Ortam değişkenleri (Production):
- `SMTP_HOST` = mail.kurumsaleposta.com · `SMTP_PORT` = 465
- `SMTP_USER` = info@dentx.com.tr · `MAIL_FROM` = info@dentx.com.tr · `LEAD_TO` = info@dentx.com.tr
- `SMTP_PASS` = info@dentx.com.tr kutusunun şifresi (Secret)
- İsteğe bağlı: Upstash Redis bağlanırsa formlarda IP başına saatlik sınır devreye girer.

Alan adı: dentx.com.tr DNS'i Natro'da. Yalnızca `@` A kaydı ve `www` kaydı Vercel'e yönlendirilir; MX ve mail kayıtlarına dokunulmaz.
Eski WordPress adresleri (`/dt-…`, `/dent-x-…-dis-poliklinigi`, `/layouts/…` vb.) `vercel.json` içinde 301 ile yönlenir; tedavi ve blog adresleri aynı kalır.
