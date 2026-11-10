---
title: Reading a 16-Test Milk Adulteration Card
summary: A computer-vision pipeline that finds a Milk-O-Mak test card in a phone photo, locates all 16 reaction pads and reads their colours — the first step towards instant milk checks at the farm gate.
area: vision
date: 2026-09
order: 0.1
context: DESIGO® Milk — R&D (in progress)
stack: [Python, OpenCV, Ultralytics YOLO, U-Net experiments, Google Colab]
metrics:
  - { label: "Pads located per card", value: "16/16" }
  - { label: "Pad placement error", value: "0.7–1.6 px" }
  - { label: "Colour stability vs raw RGB", value: "~3.5×" }
figure: ../../assets/lab/milkofit-pads.jpg
figureAlt: A Milk-O-Mak paper test card with all 16 reaction pads detected and numbered by the pipeline
figureCaption: All 16 pads found and numbered on a real card — 14 by appearance, 2 placed from the card template.
---

DESIGO® tests milk for adulterants with a paper reaction card: each of its 16 pads changes colour for one test — salicylic acid, hydrogen peroxide, salt, urea, sucrose, boric acid, neutralizers, sodium hypochlorite, freshness, formalin, glucose, starch, maltodextrin, detergent, nitrite and pH. Reading 16 colours by eye, at 4 a.m., is slow and inconsistent. This project teaches a phone camera to do it.

**Pipeline.**

- A YOLO detector finds the card in an ordinary phone photo.
- The card's circular "rosette" layout is used to align it, so any tilt or rotation is undone.
- The 16 reaction pads are cut out and their colour measured in RGB, HSV and LAB.
- Each test is then compared with its own reference colours to decide which result the pad is closer to.

**Results so far.** On every test image all 16 pads are located — 14 by appearance and 2 from the card template — with a mean placement error of 0.7–1.6 px (at most about a tenth of a pad's radius) and an angular error of 0.22–0.52°. Chromaticity features proved about 3.5× more stable than raw RGB under changing light.

**Honest status.** This is a feasibility study on a handful of cards, not a validated chemical test: the colour-to-result calibration still has to be checked against lab results before anyone relies on it. The next step is a larger labelled set from daily farm testing.
