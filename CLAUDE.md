# Sarvast — AI Marketing Platform

## What this is
An AI-powered marketing platform for SMB and enterprise teams.
Multi-agent architecture. Each agent is named after a Puranic figure.

## Tech Stack
- Next.js 14 (App Router)
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL + Auth + Storage)
- NextAuth.js with Google OAuth
- LangGraph for agent orchestration
- Claude Sonnet (reasoning), Claude Haiku (lightweight), DALL-E 3 (images)
- Inngest for background jobs
- Upstash Redis for caching
- Stripe for subscriptions
- Resend for email
- Vercel for deployment

## Agents
- Agni — Briefing & Chat
- Guru — SEO & Search
- Narad — Social
- Karma — Ads
- Mitra — Feedback & Reputation
- Vani — Content & Calendar
- Chitra — Analytics & Dashboard
- Vyas — Context Library
- Para — Competition Intelligence

## Navigation (in order)
Sarvast / Dashboard / Search / Social / Ads / Feedback / Competition / Calendar / Context Library / Connections

## Core Rules
- NEVER show data that is not sourced from a real API connection
- Empty state over wrong state. Always.
- Every metric must show its source integration
- Context Library is strictly isolated per user — no cross-user data access ever
- Row Level Security must be enabled on all Supabase tables

## Folder Structure
/app — Next.js App Router pages
/components — Reusable UI components
/agents — One folder per agent (agni, guru, narad, etc.)
/lib — Shared utilities, API clients, Supabase client
/types — TypeScript types
