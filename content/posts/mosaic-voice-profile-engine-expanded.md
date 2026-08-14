---
title: Mosaic voice profile engine expanded
excerpt: Notes from expanding Mosaic's voice signature engine — what a "voice profile" actually captures, and what we learned trying to make AI sound like a specific person.
status: published
publishedAt: 2026-06-20
---

Mosaic has one job: make AI write the way *you* do. The core of that is the voice profile — a structured signature of how a specific person actually writes, built from their real writing.

## What expanded

The first engine captured the obvious surface features: sentence length, formality, favorite constructions. The expanded engine goes after the things readers actually notice:

- **Rhythm** — how a writer alternates short punches with longer explanatory sentences.
- **Stance** — hedged or direct, warm or dry, first-person or arms-length.
- **The tells** — the small habits (em dashes, sentence fragments, how paragraphs open) that make writing recognizably someone's.

## What we learned

The hard part isn't detecting these features — it's applying them without producing parody. Turn every dial to maximum and you get an impression of the writer, not the writer. The expanded engine treats the profile as a set of tendencies, not rules, and that single change moved output from "sounds like a bot doing me" to "sounds like me on a decent day."

Next up: profile editing, so you can correct what the engine got wrong about you.
