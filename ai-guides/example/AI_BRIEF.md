# Project Overview

This project is a [short description].
The goal is to [primary outcome].

This is a long-lived project. Changes should favour:
- clarity over cleverness
- explicitness over abstraction
- maintainability over premature optimisation

---

## Technical Stack

- Framework: Svelte (Svelte 5 preferred)
- Language: JavaScript (not TypeScript unless explicitly requested)
- State management: [stores / runes / local state]
- Charts / maps: D3, TopoJSON
- Build tools: Vite
- Target environment: modern evergreen browsers

---

## Architectural Principles

- Prefer **small, composable components**
- Avoid class-based patterns
- Avoid hidden side effects
- Keep rendering declarative
- Extract reusable logic into helpers
- Avoid global state unless explicitly required

---

## Coding Style

- Use JSDoc comments for public helpers
- Prefer named functions over inline lambdas
- Avoid overly clever one-liners
- Comment *why*, not *what*
- Keep files under ~300 lines where possible

---

## Things to Avoid

- No unnecessary abstractions
- No refactors unless explicitly requested
- No breaking API changes without confirmation
- No new dependencies without asking

---

## How to Propose Changes

If a change might:
- affect architecture
- break existing behaviour
- add complexity

→ **Explain the trade-offs first before implementing.**

---

## Current Status

- Core scaffolding exists
- [Brief bullet list of what already works]
- Known pain points:
  - X
  - Y



