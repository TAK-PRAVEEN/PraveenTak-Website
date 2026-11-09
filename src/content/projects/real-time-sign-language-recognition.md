---
title: Real-Time Sign Language Recognition
summary: Webcam system that translates American Sign Language gestures (A–Z, 0–9) into text in real time.
order: 4
year: 2025
role: AI Intern — Elevate Labs
stack: [Python, TensorFlow / Keras, MobileNetV2, MediaPipe Hands, OpenCV, NumPy]
metrics:
  - { label: "Validation accuracy", value: "85.2%" }
  - { label: "Gesture images", value: "10,000+" }
links:
  code: https://github.com/TAK-PRAVEEN/Real-Time-Sign-Language-Recognition
---

- Live hand tracking with MediaPipe Hands; gestures classified by a MobileNetV2-based model.
- Recognises 36 classes (A–Z, 0–9) from a webcam feed and converts them to text with confidence scores.
- Confidence thresholding and smoothing for stable predictions; landmarks and bounding boxes drawn on the video.
- Improved validation accuracy from 72.8% to 85.2% through augmentation, feature extraction and hyperparameter tuning.
