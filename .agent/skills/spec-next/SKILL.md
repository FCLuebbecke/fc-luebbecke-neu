---
name: spec-next
description: Work the next spec. Use when the user says "next spec", "spec next", names a spec to start, or asks to continue the board.
metadata:
  speccify-workflow-version: "3"
---

# spec-next

Follow the "Spec workflow" section in `.agent/agent.md` — it is the single
source of truth. Take the spec the human moved to `Doing` (or the topmost
`Next` spec, falling back to `Backlog`, if the human asked you to start the
next spec). `Next` prioritizes work without authorizing implementation. Attack the spec
for gaps before building, work through `## Tasks` ticking as you go, write
`## Verification` and an `agent_run` history line, finish with
`station: Done` or `ready: true`. One spec in `Doing` per session.
Project/host rules and the human's authorization remain authoritative; the
board does not grant additional permissions or replace human acceptance.
