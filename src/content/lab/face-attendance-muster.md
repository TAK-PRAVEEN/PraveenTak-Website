---
title: Face-Recognition Attendance — DESIGO Muster
summary: On-device face attendance for field teams, with layered anti-spoofing, geofencing and a Hinglish voice assistant — built from Colab experiments into a Flutter app.
area: vision
date: 2026-10
order: 0.2
context: DESIGO® Milk — in use for staff attendance
stack: [Flutter, ONNX Runtime, SFace, Google ML Kit, InsightFace (research), MiniFASNet, YOLOv8n, Whisper, SQLCipher]
metrics:
  - { label: "Face embedding time", value: "27 ms" }
  - { label: "Geofence radius", value: "150 m" }
  - { label: "Passive liveness on a real face", value: "0.99" }
---

DESIGO's field staff start work at different sites before sunrise. Muster lets a supervisor's phone take attendance by face — quickly, offline, and without anyone being able to "punch in" for a friend with a photo.

**From notebook to phone.** Four Colab versions came first: comparing InsightFace (SCRFD + ArcFace) with OpenCV's YuNet + SFace, then adding a stable-face gate and lighting correction, then four-layer anti-spoofing — passive liveness (MiniFASNet), a phone/screen detector (YOLOv8n) and random head-movement challenges — and finally Hinglish voice commands.

**In the app.**

- Face matching runs entirely on the phone: a 128-dimension SFace embedding in about 27 ms per face, with blink liveness.
- Check-in only counts inside the site's geofence (150 m by default), with a late-reason prompt and per-person shift timings.
- Consent comes first: guided multi-angle enrolment, and face and voice templates never leave the device; the local database is encrypted.
- Supervisors get tasks by voice (Hinglish), scorecards, monthly pay inputs and Devanagari-ready CSV/PDF reports for the ERP.
