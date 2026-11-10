---
title: RTCOM® — DESIGO's Operating System
summary: The software that runs DESIGO® Milk end to end — farm collection, plant, delivery, customers, staff and money — so every glass bottle can be traced back to the farms it came from.
order: 1
featured: true
category: client
client: DESIGO® Milk, Jodhpur
status: Field apps in daily use on Android · ERP live · customer app in pilot
year: 2026
role: AI Engineer — architecture, design and build
stack: [Flutter, Dart, Riverpod, Supabase Postgres (RLS), Edge Functions, React 19, Vite, TypeScript, Firebase, Cloudflare, PGlite, Vitest, Playwright]
metrics:
  - { label: "Customers served", value: "~2,100" }
  - { label: "Delivery riders", value: "30+" }
  - { label: "ERP database tests", value: "3,491" }
  - { label: "API functions used by the desk", value: "543" }
modules:
  - name: RTCOM Plant
    kind: Android app · plant floor
    summary: The plant operator's app for everything between the farm truck and the cold room.
    points:
      - "Inward: arrive → weigh → quality check → pour, with chillers and stock live on the home screen."
      - "Bottling with a unique QR on every glass bottle and ghee jar; gate passes, cold room and B2B dispatch."
      - "Local-first: nothing waits on the network — it works offline and syncs in the background."
    status: In daily use
    poster: ../../assets/work/rtcom-plant.jpg
    posterAlt: RTCOM Plant design overview — one chain, five tabs, scan first
  - name: RTCOM Farm
    kind: Android app · milk collection
    summary: Used at village collection points to record every litre from the farmer to the chiller.
    points:
      - "Collection with GPS, minor → major locus batches, barrel scans and gate passes to the plant bus."
      - "A daily hisab (accounts) screen; Hindi and English, large touch targets, offline outbox."
    status: In daily use
    poster: ../../assets/work/rtcom-farm.jpg
    posterAlt: RTCOM Farm home screen on a demo farm — 535 kg collected today
    frame: phone
  - name: DESIGO Fleet
    kind: Rider app + admin console
    summary: Replaced WhatsApp-and-Excel delivery for 30+ riders and ~2,100 households, between 3:30 and 7 a.m.
    points:
      - "Daily route packet, gate-QR check at every door, bottle QR scanning and empty-bottle custody."
      - "GPS duty tracking, photo proof of delivery, a live supervisor dashboard, approvals and rider payouts."
      - "Hindi-first; works offline and replays scans when the signal returns."
    status: In daily use
    frame: phone
  - name: My DESIGO
    kind: Customer app (installable web app)
    summary: The household's own window into their milk — and the bottle's journey.
    points:
      - "Today's milk, bills, deliveries calendar, bottles and empties; pause, resume or change address."
      - "Scan a bottle's QR to see its milk journey through six stations, from farms to doorstep — farmer names, GPS and prices are never shown."
      - "Sign-in with a WhatsApp one-time code; Hindi and English."
    status: In pilot
    frame: phone
  - name: DESIGO Muster
    kind: Android app · staff attendance
    summary: Face-recognition attendance for field teams, done entirely on the phone.
    points:
      - "On-device face matching with blink liveness, a site geofence and per-person shifts."
      - "Tasks by Hinglish voice, scorecards and monthly pay inputs for the ERP; face data never leaves the device."
    status: In use
    frame: phone
  - name: RTCOM ERP
    kind: Web desk · system of record
    summary: One platform for farm collection, plant, inventory, customers, delivery, finance and workforce.
    points:
      - "Customer 360, subscriptions, delivery rounds, quality tests, farmer payments, QR allotment and a control centre."
      - "Business rules live in the database — row-level security for reads, command functions for writes, exact integer quantities and append-only ledgers."
      - "Reads the field apps through a controlled integration layer; a WhatsApp assistant handles routine customer requests."
    status: Live
    poster: ../../assets/work/rtcom-erp.jpg
    posterAlt: RTCOM ERP control centre (demo data)
---

DESIGO® sells milk from indigenous Indian cows in returnable glass bottles, and its promise is traceability: from a single bottle's QR code you should be able to see which farms' milk is inside. RTCOM is the system that makes that promise true — six connected apps, one source of truth.

**Why it is hard.** Milk is pooled at every step — village, chiller, plant, bottle — so traceability is a mass-balance problem, not a lookup. RTCOM records every transfer as an event, computes what share of each farm's milk ends up in each bottle, and refuses with a named reason instead of guessing when data is missing.

**How it is built.**

- Field apps are local-first Flutter apps: they work without signal at 4 a.m. and sync through an outbox.
- The ERP on Supabase Postgres is the system of record; every write goes through a tested database function.
- Quantities are stored as exact integers (grams, units, paise) in append-only ledgers, with idempotency keys and a concurrency harness so retries can never double-count.
