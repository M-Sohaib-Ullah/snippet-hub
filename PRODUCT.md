# Product

## Register

product

## Users

Developers and students who want to stash, share, and discover reusable code
snippets. They arrive mid-task ("I need a debounce / a CSV reader / a worker
pool") and want to find a working snippet, read it, copy or download it, and get
back to coding. A secondary, social context: people who follow others, build up a
profile of their own snippets, and browse a feed of what people they follow post.
Login is required before any content is visible.

## Product Purpose

SnippetHub is a community library of reusable code. People upload snippets (title,
description, language, tags, code); others browse, search, filter, run, copy,
download, like, comment on, fork, and save them into collections. Success looks
like: a developer finds a correct snippet fast, trusts it, and reuses it; and
contributors see their snippets get used (downloads, likes, forks). It's a real
deployed app (React + Vite on Vercel, Express serverless API, Supabase Postgres +
Storage), not a demo.

## Brand Personality

Developer-native and clean. Three words: precise, trustworthy, quietly social.
The voice is plain and concrete (it names what things do, no marketing fluff).
The interface should feel engineered, like a tool a developer already trusts
(GitHub / Linear lineage), where the *code itself* is the hero and the chrome
stays out of its way. Social signals (likes, follows, comments, collections) are
present and useful but never the loudest thing on screen.

## Anti-references

- **Generic SaaS template**: cookie-cutter equal card grids, gradient
  hero-metric blocks, the default Tailwind/Bootstrap-starter look.
- **Cluttered & busy**: noisy borders, competing chrome, decoration for its own
  sake.
- **Corporate & sterile**: cold enterprise-dashboard gray with no point of view.
- **Childish / toy-like**: candy colors, rounded-everything, overly cute.

## Design Principles

1. **Let the code be the hero.** Syntax, monospace, and the snippet body are the
   focal point; surrounding UI is deliberately quiet so code reads cleanly.
2. **Earn trust like a dev tool.** Fast, predictable, precise. Real states over
   spinners-and-hope; nothing surprising. Developers trust tools that feel
   engineered, not marketed.
3. **Social, not noisy.** Likes / follows / comments / collections aid discovery
   and motivation, but they support the snippet, they don't crowd it.
4. **Every state is designed.** Because the app is login-gated and data-driven,
   empty, loading, and error states are first-class, not afterthoughts.
5. **Accessible by default.** Keyboard reachable, visible focus, honest contrast,
   reduced-motion alternatives, works on a phone.

## Accessibility & Inclusion

Target **WCAG 2.1 AA**: body text ≥ 4.5:1 contrast (large text ≥ 3:1), full
keyboard navigation with visible focus states, `prefers-reduced-motion`
alternatives for every animation, and responsive layouts down to ~360px. Dark
and light themes both must meet contrast. Tap targets comfortable on mobile.
