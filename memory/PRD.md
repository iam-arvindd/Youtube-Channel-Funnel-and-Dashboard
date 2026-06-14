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
- [DATE: 2026-02] Backend: JWT auth, Anthropic key encrypted storage, ideas/videos/analytics/affiliates CRUD, Claude streaming chat endpoint
- [DATE: 2026-02] Frontend: Login, Dashboard KPIs, Idea Vault (50 seeds), Pipeline Kanban, Analytics, Affiliates, Calendar, Settings, embedded Claude chat panel

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
