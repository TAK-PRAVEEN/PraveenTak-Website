---
title: GoldLens AI
summary: AI-powered platform for real-time gold price prediction, multi-currency analytics and daily motivational quotes.
order: 1
featured: true
stack: [Python, FastAPI, TensorFlow, LSTM / GRU / BiLSTM, Google OAuth, MySQL, Jinja2, Docker, Chart.js, Gemini AI]
metrics:
  - { label: "Forecast RMSE", value: "~13.9" }
  - { label: "Training records", value: "4,000+" }
  - { label: "Inference", value: "<500 ms" }
links:
  demo: https://huggingface.co/spaces/PraveenTak/GoldLens-AI
  code: https://github.com/TAK-PRAVEEN/GoldLens-AI
---

- Built an end-to-end ML system for gold price forecasting using LSTM, GRU and BiLSTM models (RMSE ~13.9) on 4,000+ records.
- Shows real-time gold prices in USD, EUR, GBP and INR (18K / 22K / 24K) via public APIs.
- Delivers daily motivational quotes with Google Gemini, with Google OAuth login and user management in MySQL.
- Interactive dashboard with responsive charts and secure prediction API endpoints.
- Deployed on Hugging Face Spaces with Docker; supports concurrent users with <500 ms inference.
