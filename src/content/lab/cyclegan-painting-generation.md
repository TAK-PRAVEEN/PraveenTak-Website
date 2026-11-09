---
title: Painting Generation with CycleGAN
summary: Unpaired image-to-image translation that turns real photographs into landscape paintings.
area: generative
date: 2025-04
order: 2
context: Project Trainee — DRDO, Jodhpur
stack: [TensorFlow, PyTorch, CycleGAN, FID]
metrics:
  - { label: "FID", value: "58.4 → 49.6" }
  - { label: "Quality gain", value: "~15%" }
links:
  - { label: "Code", href: "https://github.com/TAK-PRAVEEN/Painting-Generation-using-CycleGAN" }
---

- CycleGAN-based image-to-image translation trained on artwork and painting images.
- Reduced Fréchet Inception Distance from 58.4 to 49.6 (~15%) through preprocessing, normalisation and hyperparameter tuning.
- Evaluated with FID and visual assessment for texture transfer and style preservation.
