---
title: Wholeway® — Website
summary: Brand and enquiry website for Wholeway® bajra cookies and dairy, with an interactive 3D map of where they are made.
order: 5
category: client
client: Wholeway®, Jodhpur
status: Live — wholeway.org
year: 2026
role: Design and development
stack: [Astro 7, three.js, Blender, Cloudflare Workers, Resend]
links:
  demo: https://wholeway.org
cover: ../../assets/work/wholeway-cover.jpg
coverAlt: Wholeway bajra cookies — a cookie beside its tin, with the claims "0% palm oil, 0% gluten, 8 ingredients"
---

- Static Astro site deployed on Cloudflare Workers, with an enquiry form that sends email through a Worker and Resend.
- An interactive three.js terrain map that zooms from India to Rajasthan to Jodhpur, built from Blender-rendered imagery and loaded only when the visitor asks for it.
- A claims registry: product claims render on the site only once they are marked approved, so nothing unverified is ever published.
- A no-index preview mode for reviewing changes before they go public.
