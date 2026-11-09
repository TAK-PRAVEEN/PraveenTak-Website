---
title: Yutori
summary: Verified household services at fixed prices for people renting in Jaipur — a customer app and a provider app.
order: 6
category: product
status: In development
year: 2026
role: Product, design and engineering
stack: [Flutter, Dart, Riverpod, go_router, Supabase (RLS, Edge Functions), pgTAP, Sentry, PostHog, GitHub Actions]
---

- A Flutter workspace with two apps (customer and provider) sharing core, UI and data packages.
- Feature-first architecture, with money and reward points calculated on the server — never trusted from the client.
- Database-level security with row-level security policies tested in pgTAP.
- A tokenised design system with English and Hindi strings, and switchable visual directions.
- Built so far: OTP login, service catalogue, booking, provider onboarding and the job flow; Android and iOS builds on GitHub Actions.
