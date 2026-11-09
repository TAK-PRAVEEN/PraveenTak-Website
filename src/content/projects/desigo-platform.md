---
title: DESIGO® Supply-Chain Platform
summary: Three connected systems that trace milk from farm to doorstep — a rider app, a farm-and-plant traceability app and a business ERP.
order: 1
featured: true
category: client
client: DESIGO® Milk, Jodhpur
status: Field apps deployed on Android · ERP in pre-release
year: 2026
role: Sole engineer — architecture, design and build
stack: [Flutter, Dart, Riverpod, Firebase Realtime Database, Cloudflare Workers + R2, TypeScript, React 19, Supabase Postgres (RLS), PGlite, Vitest]
metrics:
  - { label: "ERP database tests", value: "3,567" }
  - { label: "Operations app tests", value: "1,697" }
  - { label: "Fleet app tests", value: "1,269" }
---

DESIGO® sells milk from indigenous Indian cows in returnable glass bottles. The promise is traceability — so the software has to answer, from a single bottle's QR code, which farms' milk is inside and in what proportion, and survive being audited on that answer.

**DESIGO® Fleet — delivery.** A rider app and admin console that replaced WhatsApp-and-Excel delivery operations.

- Foreground-service GPS duty tracking with a watchdog, and offline map tiles for routes.
- QR bottle custody with check-digit IDs, and an offline scan queue that replays on reconnect.
- Photo proof of delivery stored in Cloudflare R2 behind a Worker that holds no secret — callers authorise with their own Firebase token.

**RTCOM® Operations — farm and plant.** An Android field app that records collection, chilling, barrels, dispatch, plant receipt, batches and filling — a mass-balance traceability ledger rather than a CRUD app.

- Encrypted offline outbox (SQLCipher), verified on hardware.
- One shared Firebase project with Fleet, because the glass bottle is the same physical object in both apps; security rules are merged and tested so neither app can break the other.
- Composition and mass-balance kernels that compute what proportion of each farm's milk ends up in each bottle.

**RTCOM ERP — the business system of record.** Farm collection, plant, inventory, customers, delivery, finance and workforce on one platform; it reads the field apps through a controlled integration layer and never writes to them.

- Business rules live in the database: row-level security for reads, command functions for writes.
- Exact quantities stored as integers (grams, units, paise); append-only ledgers with derived balances.
- Idempotency keys, a concurrency harness and fault injection for atomicity; an undecided policy refuses with a named reason instead of guessing.
