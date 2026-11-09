---
title: AI-Driven Code Reviewer
summary: LLM-powered Python code reviewer that combines static analysis with Qwen 2.5 suggestions and a code-aware chat.
order: 2
featured: true
year: 2026
role: AI Intern — Infosys Springboard
stack: [Python, Streamlit, Qwen2.5-7B-Instruct, Hugging Face Inference API, LangChain, AST, Pylint]
metrics:
  - { label: "Code issues detected", value: "20+" }
  - { label: "Fewer lint violations / 1k LOC", value: "~30%" }
  - { label: "Feedback latency", value: "<2 s" }
links:
  demo: https://ai-driven-code-reviewer.streamlit.app/
  code: https://github.com/TAK-PRAVEEN/AI-Driven-Code-Reviewer
---

- Parses Python source into an Abstract Syntax Tree to understand structure and logic, and visualises the AST.
- Detects syntax errors and likely runtime issues with static analysis, and checks style against PEP 8.
- Uses Qwen2.5-7B-Instruct (via Hugging Face) to propose refactors and bug fixes, plus a chat interface for questions about the code.
- Reduced linting violations from 50+ to 35 per 1,000 lines of code (~30% improvement).
- Streamlit review platform delivers AI-generated feedback in under 2 seconds; built during the Infosys Springboard virtual internship.
