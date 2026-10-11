# SiteScope AI - Website & Competitor Audit Platform

> 🌐 **Live Demo**: [http://98.91.229.53/](http://98.91.229.53/)  
> 📦 **GitHub Repository**: [https://github.com/latesh1/audit-tool](https://github.com/latesh1/audit-tool)

A full-stack, enterprise-grade website auditing and competitor benchmark platform built with **Laravel 12** and **React 19 + TypeScript + Vite + Tailwind CSS**.

SiteScope AI crawls live website HTML/metadata, runs strict deterministic SEO & UX rule engines, benchmarks against 1–2 competitors, and synthesizes evidence-backed insights using LLMs (Google Gemini, Groq, or deterministic zero-API-key fallback).

---

## 🚀 Features & Completed Requirements Checklist

- [x] **Website Auditing**: Real-time HTTP extraction of primary websites and 1–2 competitors with full metadata, DOM nodes, schema, open graph, and link structures.
- [x] **SEO Checks**: Validates titles, meta descriptions, H1–H6 hierarchy, canonical tags, robot tags, image dimensions & missing alt text, internal/external links, and favicon presence.
- [x] **UX & Accessibility Checks**: Verifies mobile responsive viewport tags, CTA button counts, HTML `lang` attributes, image accessibility, and synthetic Core Web Vitals (LCP, INP, CLS, TTFB).
- [x] **Competitor Comparison**: Matrix side-by-side comparison comparing speed, title tags, heading depth, word counts, and content gap analysis.
- [x] **AI-Generated Insights**: Pluggable provider system (Google Gemini, Groq) with automatic deterministic fallback if no API keys are provided or during network timeouts.
- [x] **Audit History & Persistence**: SQLite/MySQL database persistence. Re-open previous audit reports at any time with full snapshot details.
- [x] **Reliability & SSRF Security**: Safe website fetcher blocking loopback, RFC 1918 private subnets, cloud metadata IPs (`169.254.169.254`), non-standard ports, and multi-hop unsafe redirects.
- [x] **SERP & Social Preview Studio**: Desktop/mobile Google SERP pixel-length simulator and Twitter/Facebook OpenGraph card previewer.
- [x] **Fix Action Plan & Executive Export**: Interactive checklist tracker with score projections and printable PDF/Executive summary modal.

---

## 🛠️ Architecture & Tech Stack

- **Backend**: PHP 8.2+, Laravel 12, SQLite (or MySQL)
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts
- **Testing**: PHPUnit / Pest with 26 automated unit and feature tests

---

## 📦 Getting Started & Setup Instructions

### 1. Prerequisites
- **PHP 8.2+** with `curl`, `mbstring`, `dom`, `sqlite3` extensions enabled.
- **Composer 2+**
- **Node.js 18+** & `npm`

### 2. Backend Setup

```bash
# Copy environment configuration
cp .env.example .env

# Generate application encryption key
php artisan key:generate

# Run database migrations and demo seeders
php artisan migrate --seed

# Start Laravel backend API server
php artisan serve --port=8000
```
Backend API will be accessible at: `http://127.0.0.1:8000`

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Frontend application will be accessible at: `http://localhost:5173`

---

## 🧠 AI Provider Configuration (Zero Cost / Free Tier)

SiteScope AI is designed to work **100% out of the box** without requiring any API keys. If `AI_PROVIDER=none`, the system uses an intelligent, rule-based deterministic fallback engine.

To enable live LLM synthesis, set the following in your root `.env` file:

### Option A: Google Gemini (Free Tier)
```env
AI_PROVIDER=gemini
AI_API_KEY=your_gemini_api_key_here
AI_MODEL=gemini-1.5-flash
```

### Option B: Groq Cloud (Free Tier)
```env
AI_PROVIDER=groq
AI_API_KEY=gsk_your_groq_api_key_here
AI_MODEL=llama-3.3-70b-versatile
```

---

## 🧪 Running Automated Tests

Run the backend test suite:
```bash
php artisan test
```

Build and type-check the frontend:
```bash
cd frontend && npm run build
```

---

## 🛡️ Security & SSRF Protection Details

All outbound HTTP calls are inspected by `SafeWebsiteFetcher` and `WebsiteUrlValidator`:
- **Protocol Whitelist**: Strict `http` and `https` only.
- **IP Blacklist**: Loopback (`127.0.0.0/8`, `::1`), RFC 1918 (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), Link-local (`169.254.0.0/16`), and AWS/GCP cloud metadata.
- **Timeouts**: 5-second socket connect timeout and 15-second total request timeout.
- **Payload Bound**: Maximum 5MB response body size.