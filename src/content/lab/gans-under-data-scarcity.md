---
title: GANs Under Data Scarcity
summary: Controlled study of how four GAN loss functions behave as training data is starved from 25,000 to 1,000 images.
area: research
date: 2026-03
order: 1
context: Independent research paper — Understanding, Failure Modes, and Solutions
stack: [PyTorch, DCGAN, Tiny-ImageNet-200, Vanilla GAN, LSGAN, WGAN, WGAN-GP]
metrics:
  - { label: "Training runs", value: "16" }
  - { label: "LSGAN G-loss std @ 25k", value: "0.075" }
  - { label: "WGAN-GP epoch @ 25k", value: "~557 s" }
links:
  - { label: "Code & experiments", href: "https://github.com/TAK-PRAVEEN/GANs_Under_Data_Scarcity" }
---

GANs need large datasets; with little data the discriminator overfits and training collapses. This study isolates one variable — the adversarial loss — and measures what happens as data runs out.

**Setup.** A fixed DCGAN backbone (≈3.58 M generator / 2.77 M discriminator parameters) trained on class-balanced Tiny-ImageNet-200 subsets of 1,000, 5,000, 10,000 and 25,000 images: 4 losses × 4 sizes = 16 runs, identical optimiser and schedule, fixed validation set.

**Findings.**

- **LSGAN is the most consistently stable** — lowest generator-loss variance at every size (0.886 → 0.075 from 1k to 25k).
- **WGAN with weight clipping collapses at 1,000 images** (critic loss ≈ −5392, generator-loss std ≈ 918), despite being stable with more data.
- **Vanilla GAN** stays numerically stable but saturates at a persistently high generator loss (≈ 5–6).
- **WGAN-GP regularises strongly but is expensive**: ~557 s per epoch at 25k images versus ~27 s for LSGAN.

**Takeaway.** There is no universal winner. In a strictly low-data regime, LSGAN is the best compromise between adversarial stability and compute.
