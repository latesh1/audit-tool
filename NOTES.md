# SAVIT INTERACTIVE - Take-Home Assignment: Technical Notes

## 1. Project Overview & Architecture Decisions
**SiteScope AI** is an AI-powered Website & Competitor Audit Platform designed to satisfy all requirements of the Savit Interactive Take-Home Assignment.

The core architecture strictly separates **measured HTML evidence** from **AI interpretive synthesis**:
- **Deterministic Engine**: 20+ checks evaluated directly from parsed HTML trees, HTTP response headers, and DOM structures.
- **Competitor Benchmark Matrix**: Direct side-by-side metric comparison derived solely from extracted facts (no hallucinated competitor data).
- **AI Synthesis**: Generates client summaries, high/medium/low priority recommendations, strengths, and weaknesses. Supports Google Gemini (Free Tier) and Groq Cloud (Free Tier Llama 3.3 70B), alongside an automatic zero-configuration **Deterministic Fallback Provider** that ensures full report generation without external dependencies.

---

## 2. Security & Hardening (SSRF Protection)
A critical requirement for any web auditing tool that fetches external URLs is mitigating Server-Side Request Forgery (SSRF). The implementation includes:
1. **Scheme Validation**: Enforces http:// and https:// only (disallowing file://, gopher://, ftp://, etc.).
2. **DNS Resolution & Private IP Guard**: Resolves the hostname before initiating requests and compares against private and reserved CIDR blocks:
   - 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 (RFC 1918 Private Internets)
   - 127.0.0.0/8 (Loopback / Localhost)
   - 169.254.0.0/16 (Link-local / Cloud metadata endpoint 169.254.169.254)
   - 0.0.0.0/8, 224.0.0.0/4 (Broadcast & Multicast)
   - IPv6 loopbacks (::1) and unique local addresses (fc00::/7).
3. **Redirect Hop Inspection**: Redirects are evaluated iteratively (up to 5 hops), verifying destination IPs at each step to prevent DNS rebinding or redirect-based SSRF bypasses.
4. **Download Limits**: Response body size is bounded (max 5 MB) and HTTP request timeouts are enforced (15 seconds) to prevent slowloris or memory exhaustion attacks.

---

## 3. Current Limitations

1. **Static HTML vs. Client-Rendered SPAs**:
   - The current web crawler inspects raw server-rendered HTML. Single Page Applications (SPAs) built entirely with client-side JavaScript rendering (where the initial HTML contains only an empty container) yield limited extractable text and visible headings.
   - *Industry standard recommendation*: Modern SEO best practices mandate SSR (Server-Side Rendering) or SSG (Static Site Generation) for indexable public pages.

2. **Single-Page Scope vs. Full Crawl**:
   - The tool audits the specified landing or entry URL. It extracts and categorizes internal vs. external links on that page, but does not perform a recursive deep crawl of hundreds of child pages.

3. **Heuristic UX vs. Real User Monitoring (RUM)**:
   - UX signals are evaluated through measurable DOM structures (viewport meta tags, landmark elements, CTA contrast/labels, forms, contact links, duplicate element IDs). These provide deterministic indicators without claiming subjective visual judgments.

---

## 4. Future Improvements & Roadmap

1. **Headless Browser Rendering (Puppeteer / Playwright)**:
   - Integrate an optional headless Chromium worker queue to capture fully hydrated DOMs for JS-heavy SPAs and measure Core Web Vitals (LCP, FID/INP, CLS).

2. **Automated Lighthouse / CrUX Integration**:
   - Incorporate the Google Chrome UX Report (CrUX) API for real-world user performance telemetry.

3. **Asynchronous Background Job Queues**:
   - Use Laravel queues (Redis / Horizon) for background concurrency when handling batch audits of 10+ competitor domains simultaneously.

4. **Automated Scheduled Audits & Drift Alerts**:
   - Enable users to schedule weekly automated audits with email/Slack notifications when SEO scores drop or competitive gaps widen.

5. **PDF / White-Label Export**:
   - Add automated server-side PDF generation for one-click branded executive client deliverables.