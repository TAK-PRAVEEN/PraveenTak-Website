---
title: Crew Fit Check — PPE Detection for Delivery Staff
summary: Checking from one photo whether a delivery rider is wearing the full DESIGO crew kit — helmet, crew jacket, gloves and safety shoes — before the morning round.
area: vision
date: 2026-11
order: 0.3
context: DESIGO® Milk — in progress (phase 0 of 3)
stack: [Grounding DINO, Ultralytics YOLO11, OCR, CVAT, ONNX]
metrics:
  - { label: "Detection classes", value: "9" }
  - { label: "Photos in phase-0 check", value: "17" }
  - { label: "Kit items checked", value: "4" }
figure: ../../assets/lab/crew-fit-check.jpg
figureAlt: A delivery rider at night with detection boxes for "no helmet", "DESIGO jacket" and "gloves"; the face is blurred
figureCaption: Phase-0 output on a real morning photo — jacket and gloves found, helmet missing. Face blurred for privacy.
---

DESIGO's riders deliver in the dark between 3:30 and 7 a.m. The crew dress standard asks for a helmet, the reflective DESIGO CREW jacket, gloves and proper shoes — this project checks it automatically from a single photo and returns **PASS**, **FAIL** or **INCOMPLETE**.

**How it works.**

- Nine classes cover each item and its "missing" counterpart — helmet / bare head, crew jacket / other upperwear, gloves / bare hands, safety shoes / other footwear.
- The jacket is confirmed by its reflective stripes and by reading the printed "DESIGO CREW" text.

**Plan.**

- **Phase 0 (done):** zero-shot labelling with Grounding DINO to bootstrap annotations — on the first 17 photos it already shows where riders fall short (shoes and helmets most often).
- **Phase 1:** a fine-tuned YOLO11 model on ~150 labelled photos.
- **Phase 2:** YOLO11s vs YOLO11m with active learning on 400–1,000 photos.
- **Phase 3:** a live camera check at the gate with 10-frame voting, exported to ONNX.
