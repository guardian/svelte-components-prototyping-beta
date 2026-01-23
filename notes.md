Notes on using AI_BRIEF

At the start of a coding session, paste something like this:

“We’re continuing work on this project. Please follow AI_BRIEF.md.
Do not refactor unrelated code.
Ask before making architectural changes.”

To make updates add something like the following to AI_BRIEF...

---

### Task
Add X to Y.

### Constraints
- Must not change existing API
- Must work with current data format
- Mobile first approach

### Success Criteria
- [ ] Does A
- [ ] Does B
- [ ] No changes to C

### Context
This will later be used for Z, so avoid tight coupling.

---

Optional for long term projects... Tell Cursor:

“Respect decisions in DECISIONS.md unless explicitly revisited.”

Example structure for DECISIONS.md:

---

## 2025-01-10
Chose Svelte stores over global event bus
Reason: simplicity and testability

## 2025-01-18
Avoided Mapbox in favour of MapLibre
Reason: licensing + portability

---

## Example Prompts

Here are **Cursor-specific prompt presets** you can copy/paste and reuse. The idea is: one “anchor” preset you run at the start of a session, then smaller task presets you drop in as needed.

## 1) Session Anchor (paste first thing each session)

```text
You are my pair-programmer inside Cursor.

Follow the repo’s AI_BRIEF.md (and DECISIONS.md if present) as the source of truth.
If anything conflicts with them, ask before proceeding.

Operating rules:
- Prefer minimal diffs. Do not refactor unrelated code.
- Do not add new dependencies without asking.
- Keep solutions simple, explicit, and maintainable.
- Use existing patterns in this repo (naming, structure, style).
- If you’re uncertain, state assumptions and ask ONE targeted question (only if truly blocking).

Before coding:
1) Briefly restate the goal in 1–2 lines.
2) List the files you expect to touch.
3) Outline the steps you’ll take.

While coding:
- Provide changes as a clear patch/edited-file output.
- Ensure code compiles/runs and doesn’t break existing exports/APIs.

After coding:
- Summarise what changed and why.
- Note any follow-ups or risks.
```

---

## 2) Small, Safe Change (minimal diff)

```text
Task: <describe change>

Constraints:
- Minimal diff, no refactors.
- No new deps.
- Preserve existing public APIs.

Success criteria:
- [ ] <thing works>
- [ ] <tests/build pass>
- [ ] <no behaviour regressions>

Please:
- Identify the exact file(s) and location(s) to change.
- Implement the smallest viable fix.
- Explain any assumptions.
```

---

## 3) New Feature (scoped, with guardrails)

```text
Feature: <what you want>

Context:
- This is part of: <bigger goal>
- Users will: <user story>

Constraints:
- Don’t change unrelated components.
- Keep architecture consistent with AI_BRIEF.md.
- Add types via JSDoc (not TypeScript) unless requested.

Definition of done:
- [ ] UI/behaviour works as described
- [ ] Edge cases handled: <list>
- [ ] Basic usage documented (README or inline)
- [ ] No new dependencies without approval

Process:
1) Propose a small implementation plan (bullets).
2) Name the files you’ll create/edit.
3) Then implement.
```

---

## 4) Debugging / “Why is this broken?”

```text
I have a bug.

What I observe:
- <symptom>

Expected:
- <expected behaviour>

Repro steps:
1) ...
2) ...

Env:
- OS: macOS
- Node: <version>
- Package manager: <npm/pnpm/yarn>
- Framework: <SvelteKit etc>

Please:
- Start by listing 3–5 likely causes (ranked).
- Tell me what to inspect first (specific files/lines/logs).
- Then propose the smallest fix.
- Avoid refactors.
```

---

## 5) Refactor (only when you explicitly want it)

```text
Refactor request: <what + why>

Guardrails:
- Behaviour must remain identical (unless stated).
- Keep diffs reviewable: small commits / small steps.
- No dependency changes.
- Add/update tests only if necessary.

Please:
1) Identify risks and a rollback plan.
2) Propose a step-by-step refactor sequence.
3) Implement in small stages (pause between stages if something is ambiguous).
```

---

## 6) Architecture Decision (when you’re unsure and want options)

```text
I’m deciding between approaches for: <problem>.

Constraints:
- <performance / simplicity / deadlines>
- <stack constraints>

Please:
- Give me 2–3 options with trade-offs.
- Recommend one given the constraints.
- Show a minimal example of the recommended approach in this repo’s style.
Do not implement big changes yet—wait for my “go”.
```

---

## 7) “Maintain the Plan” (when you keep drip-feeding tasks)

```text
Keep a running plan as we work.

At the top of your response each time, include:
PLAN:
- ✅ done
- 🔜 next
- 🧩 later

When I give a new instruction, update the plan and then implement only the next step.
Keep the plan consistent with AI_BRIEF.md.
```
