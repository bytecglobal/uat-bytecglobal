# BYTECCLOUD — PRODUCTION DEPLOYMENT CHECKLIST & RUNBOOK

**Target Website:** BytecCloud / BytecGlobal  
**Release Readiness Version:** 1.0.0 (Production Hardened)  
**Deployment Classification:** **READY WITH MANUAL ACTIONS** (Requires Operator API Keys & Domain DNS)  

---

## 1. Pre-Deployment Verification Runbook

Before initiating deployment to the production server or cloud host, execute the following commands locally or in CI/CD pipeline:

```bash
# 1. Clean installation of dependencies
npm ci

# 2. Static linting verification (Must report 0 errors and 0 warnings)
npm run lint

# 3. TypeScript compilation & strict type checking (Must report 0 errors)
npm run type-check

# 4. Production Next.js build (Must compile all 32 static & dynamic routes successfully)
npm run build
```

---

## 2. Production Environment Variable Setup

Configure the following environment variables in your production hosting dashboard (e.g., Vercel Project Settings, AWS Amplify, Cloudflare Pages, or Docker/Kubernetes secrets):

| Variable Name | Required | Exposure Level | Example Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SITE_URL` | **Yes** | Client & Server | `https://bytecglobal.com` | Primary canonical URL (no trailing slash). |
| `CONTACT_RECIPIENT_EMAIL` | **Yes** | **Server Only** | `inquiries@bytecglobal.com` | Target inbox for client inquiries. |
| `RESEND_API_KEY` | **Yes** | **Server Only** | `re_1234567890abcdef...` | Resend API secret key for email dispatch. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Optional | Client & Server | `bytecglobal@gmail.com` | Fallback email displayed in UI. |
| `NEXT_PUBLIC_CONTACT_PHONE` | Optional | Client & Server | `+91 98765 43210` | Business phone displayed on site. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER`| Optional | Client & Server | `919876543210` | WhatsApp number (digits only). If omitted, floating WhatsApp button is hidden. |

> [!CAUTION]
> Never prefix `RESEND_API_KEY` with `NEXT_PUBLIC_`. Keep it strictly as a server-side environment secret.

---

## 3. Domain, DNS & SSL Configuration Guidance

### 3.1 DNS Records Setup
Configure authoritative DNS records at your registrar or Cloudflare:

| Type | Name | Content / Target | Proxy Status | Note |
| :--- | :--- | :--- | :--- | :--- |
| `A` / `CNAME` | `@` (apex) | Host IP / `cname.vercel-dns.com` | Proxied | Primary apex domain record |
| `CNAME` | `www` | `bytecglobal.com` | Proxied | Canonical redirect to apex |
| `TXT` | `@` | Resend SPF / DKIM records | DNS Only | For email deliverability |

### 3.2 Canonical Domain Redirect (Apex vs. WWW)
- Enforce a single canonical origin in your host dashboard: redirect `https://www.bytecglobal.com/*` $\rightarrow$ `https://bytecglobal.com/*` with a permanent HTTP 301 redirect.
- Avoid duplicate indexing by search engines.

### 3.3 SSL/TLS & HSTS Preload
- Enable **Full (Strict) SSL/TLS** encryption mode.
- Ensure automated SSL renewal (Let's Encrypt, Cloudflare, or AWS Certificate Manager).
- Once SSL is verified, submit the domain to [hstspreload.org](https://hstspreload.org) (the application already delivers `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`).

### 3.4 DNSSEC & Registrar Security
- Enable **DNSSEC** at your domain registrar to prevent DNS spoofing and cache poisoning.
- Enable **Registrar Transfer Lock** and **Hardware Key / Authenticator App 2FA** on the domain registrar account.

---

## 4. Cloudflare / WAF Edge Recommendations

If deploying behind Cloudflare or an edge reverse proxy:

1. **WAF Rules:**
   - Enable Cloudflare Managed Ruleset (OWASP Core Ruleset) with anomaly score threshold.
   - Block or challenge traffic scoring $\ge 80$ Threat Score.
2. **DDoS Protection:**
   - Set HTTP DDoS rate limiting: challenge clients sending $> 100$ requests per minute to `/api/*`.
3. **Bot Fight Mode:**
   - Enable Bot Fight Mode to challenge automated credential stuffers and scrapers.
4. **Security Headers Verification:**
   - Verify that your edge proxy does not overwrite the application's Next.js security headers (`Content-Security-Policy`, `X-Frame-Options`, `Permissions-Policy`).

---

## 5. Post-Deployment Smoke Test Checklist

Once the website is live on the production domain, perform these verifications:

- [ ] **Home Page Load:** Verify 3D particle sphere renders and responds to pointer movement.
- [ ] **Navigation & Links:** Test all header navigation links (`/about`, `/services`, `/solutions`, `/projects`, `/technologies`, `/contact`, `/start-project`).
- [ ] **Dynamic Service Pages:** Visit `/services/software-development`, `/services/ai-ml-development`, etc. Verify FAQ accordions expand/collapse properly.
- [ ] **Client Work Galleries:** Visit `/client-work/travel-booking-platform` and test slideshow next/prev and keyboard controls.
- [ ] **Contact Form Submission:**
  - Submit a test inquiry with valid data: verify immediate confirmation banner.
  - Check the designated recipient inbox (`inquiries@bytecglobal.com`) for the formatted email.
  - Test validation rejection with invalid email or missing fields.
  - Submit 6 rapid requests to verify IP rate limiter returns HTTP 429.
- [ ] **Start Project Form Submission:**
  - Submit a test brief with budget/timeline selection: verify confirmation.
- [ ] **WhatsApp FAB:**
  - If `NEXT_PUBLIC_WHATSAPP_NUMBER` is set, verify clicking opens `https://wa.me/<number>`.
  - If unset, verify the floating button is completely removed from the DOM.
- [ ] **Security Headers Test:**
  - Run a scan on [securityheaders.com](https://securityheaders.com) targeting `https://bytecglobal.com`.
  - Expected rating: **A+ / A**.
- [ ] **Error Handling (404 / 500):**
  - Visit `/this-route-does-not-exist` to verify custom 404 page.
  - Verify no sensitive server paths are displayed.
- [ ] **Sitemap & Robots:**
  - Fetch `https://bytecglobal.com/robots.txt` and `https://bytecglobal.com/sitemap.xml`.
  - Verify all 32 URLs are present and formatted with priorities.

---

## 6. Incident Response & Secret Rotation Runbook

If the `RESEND_API_KEY` or any external credential is ever compromised:
1. Immediately log into [resend.com/api-keys](https://resend.com/api-keys) and revoke the compromised key.
2. Generate a new restricted API key.
3. Update the `RESEND_API_KEY` secret in your production host environment settings.
4. Trigger a zero-downtime redeployment.
5. Verify outbound inquiry delivery using the smoke test above.

---
*Runbook prepared by Principal DevSecOps & Production Infrastructure Specialist.*
