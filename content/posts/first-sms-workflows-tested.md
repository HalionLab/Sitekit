---
title: First SMS workflows tested
excerpt: The first end-to-end SMS workflows ran this week — a customer texts in, a digital employee handles the exchange, and the owner sees only the finished thread.
status: published
publishedAt: 2026-06-12
---

This week the first SMS workflows ran end to end. A customer texts a business number, a QuietOS digital employee handles the back-and-forth, and the owner sees only the finished thread waiting in the inbox for approval.

## What we tested

- **Inbound triage** — reading an incoming text, classifying the intent (booking, question, complaint), and routing it to the right workflow.
- **The reply loop** — drafting a response, holding it for approval when confidence is low, sending directly when it's high.
- **Handoff** — the escape hatch that matters most: when the conversation exceeds what the workflow should decide, it stops and hands the thread to the owner with context, not a transcript dump.

## What broke

Plenty. Real customer texts are messier than any test fixture — three questions in one message, replies to messages from last week, and the classic single "?" — and the triage step needed several rounds before it stopped being confidently wrong. That's exactly why we test on real conversations before shipping anything.

The workflows stay in supervised mode — every outbound message approved by a human — until the error rate earns autonomy.
