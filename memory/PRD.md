# Finance YouTube Channel Command Center — PRD

## Problem Statement
Solo creator building a faceless finance YouTube channel (India + global English audience) needs a single dashboard to manage the full workflow: ideas, scripting via Claude, production pipeline, analytics, affiliate income, and publishing calendar. User pastes their own Anthropic API key into Settings.

## User Personas
- **Solo Creator** (you): owns the channel end-to-end, uses ElevenLabs / InVideo externally, needs status tracking + Claude script generation in one place.

## Core Requirements
- Single-user JWT auth (admin only, no public signup)
- Anthropic API key stored encrypted (Fernet) — user-supplied via Settings
- Claude Sonnet 4.6 chat with streaming responses, conversation history per video
- Idea Vault: 50 preloaded finance topics, CRUD, rating, search/filter by sub-niche
- Pipeline Kanban: 6 stages (Idea → Script → Voiceover → Video → Thumbnail → Published), drag & drop
- Analytics: views, CTR, retention, RPM, AdSense + total earnings per video (manual entry)
- Affiliates: track partners (Groww, Zerodha, Upstox, etc.), monthly earnings entries
- Calendar: publishing schedule
- Premium light-theme UI (Bone white + Deep Pine #00594C + Terracotta accent), Cabinet Grotesk + Manrope fonts, glassmorphism, framer-motion micro-interactions

## What's Been Implemented (Feb 2026)
- [2026-02] Backend: JWT auth, Anthropic key encrypted storage, ideas/videos/analytics/affiliates CRUD, Claude streaming chat
- [2026-02] Frontend: Login, Dashboard, Vault (50), Pipeline Kanban with chat drawer, Analytics, Affiliates, Calendar, Settings
- [2026-02] Object storage (Emergent) uploads for thumbnails + voiceover; script export (.txt/.docx)
- [2026-02] YouTube Data API (key-based): per-video sync + bulk "Sync all from YouTube"
- [2026-02] Gemini Nano Banana thumbnail generator (optional, AI-tagged)
- [2026-02] Resend email digest with on/off toggle + send-now
- [2026-02] Thumbnail A/B tracker (AI vs Human variants, CTR auto-compute, winner highlight)
- [2026-02] YouTube Analytics API (OAuth 2.0): retention curve + traffic sources + summary metrics per video
- [2026-02] Dark mode toggle (persistent via localStorage; sidebar toggle with animated switch)
- [2026-02] DEPLOYMENT: passed static analysis, ready to ship

## Prioritized Backlog
### P1 (next)
- YouTube API integration to auto-pull views/CTR
- Export script to .txt / .docx
- Video reference file uploads (thumbnail PNG, voiceover MP3) via object storage
### P2
- Multi-channel support
- Sponsor outreach CRM
- AI thumbnail generator (Gemini Nano Banana)
- Auto title/description SEO scorer
