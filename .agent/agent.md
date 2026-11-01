# Project agent guidance

This file is the agent-independent source of truth for this project. Host files like `CLAUDE.md` and `AGENTS.md` only point here.

<!-- speccify:workflow:begin v16 -->
## Spec workflow

The human owns priorities, authorization and acceptance; you implement the
requested spec. The Speccify app watches project files, it does not grant
permission or direct your work. Explicit project and host rules take
precedence over these workflow defaults, including commit/push permissions
and attribution/provenance restrictions.

### Where everything lives

- Specs: `.agent/specs/<NNN-slug>/SPEC.md` — the folder name is the id,
  its running number (`012-…`) is how people refer to the spec ("spec 12");
  flat `key: value` front matter between `---` lines, then a Markdown body
  whose first `#` heading is the title. Stations: `Backlog`, `Next`, `Doing`,
  `Done`. Finished specs stay in place in `Done`; there is no archiving step.
  Existing `.agent/specs/archive/` content is historical, remains discoverable
  and is read-only in spec actions. Do not delete or relocate it automatically.
  New specs take the next free number, including historical numbers
  (the app does this; by hand: highest number + 1).
- Spec history: `.agent/specs/<slug>/history.jsonl` (append-only).
- Playbooks: `.agent/specs/playbooks/<name>.md` — standing procedures, reused,
  never "worked off". They live next to the specs, so with a shared register
  (below) they are shared and synced the same way. Relative links from a
  playbook to a spec read `../<NNN-slug>/SPEC.md`. Playbooks still under the
  old `.agent/playbooks/` are read as well until "Einrichten" moves them;
  create new ones only in `.agent/specs/playbooks/`.
  Frontmatter `status: draft` marks nonbinding ideas or research, not workflow
  instructions or implementation authorization. Read or edit a draft only for
  an explicit discussion/review/edit request; preserve its status. Applying a
  playbook requires `status: active` or no status field (legacy default).
  Unknown, duplicate or malformed status is not active; clarify it before use.
  Only an explicit human decision activates a draft. General requests to work
  according to playbooks do not activate drafts.
- Skills: `.agent/skills/<name>/SKILL.md` · Tools: `.agent/tools/<name>/TOOL.md`.
- Project actions: `.agent/actions.json` · Project settings: `.agent/settings.json`,
  including the project's module list (`modules`, see below).

### What a spec is

One piece of work a human wants to accept in one review: a feature, a
refactor, an investigation. Its body has these sections: `## Why`,
`## What` (scope, and what is out), `## Acceptance` (testable "when …,
then …" statements), `## Decisions` (numbered, dated), `## Tasks`
(checkboxes — the steps, not separate files), `## Verification` (what was
run, what was seen), `## Review` (what the human checks, once ready),
`## Questions`. Too big for one review → child specs
with `parent: <slug>`; too small → a task in an existing spec. A spec
without `order` is an idea and sorts last. Its front matter names the
modules it touches (`modules: a, b`, see "Modules and parallel work").

### Modules and parallel work

Several agents may work on the same project at once. What keeps them from
colliding is knowing which parts of the system each spec touches:

- `.agent/settings.json` → `modules` is the project's architecture map: a list
  of `{ "name", "description", "paths" }` entries (`paths` optional). Names are
  slugs (`terminal`, `board`, `api-auth`). The human maintains it in the app;
  you may propose entries.
- Every spec names the modules it touches in its front matter:
  `modules: terminal, board` (comma-separated). You own this field: when you
  touch a module the spec does not list, add it — before the change, not after.
- **Before you start a spec**, compare its `modules` with every other spec in
  `Doing`. Any overlap means another agent or person may be changing the same
  code right now: say so, name the specs, and let the human decide whether to
  proceed, wait or re-cut. Never start on an overlap silently.
- **When you cut specs** (new specs, child specs, splitting): keep the set of
  modules per spec as small as possible and split along module boundaries, so
  that specs can run in parallel. Cutting requires an architecture idea that
  names the modules. If `modules` in `.agent/settings.json` is missing or does
  not cover the affected code, do not guess: propose a module list derived
  from the code structure and ask the human to confirm it first.

### Getting started

Read prioritized specs in `Next` before `Backlog`, smallest `order` first
within each station. If the human named a spec, take that one. `Next` marks
what should come next; it does not authorize implementation. Never invent
tickets or sub-files: the tasks live in the spec.

### Working a spec

1. **Backlog/Next → Doing is the human's gate.** Start a spec only when the
   human moved it to `Doing` or asked you to start it. Then set
   `station: Doing` and log `station_changed`. Keep **one spec in `Doing`
   per session**; finish or park it before taking the next.
2. **Attack the spec before building:** missing or untestable acceptance,
   contradictions, hidden dependencies, scope that has silently grown. Fix
   what you can in the spec itself and say so in `## Decisions`; ask the
   rest (below).
3. Work through `## Tasks`: tick `- [x]` as you go, add tasks you discover
   (mark them `(added)`), keep short notes indented under a task. Never
   rewrite front matter you do not own (`modules` is yours; `owner`,
   `branch` and the human's flags are not).
   The board counts Markdown task lists throughout the spec body, excluding
   code blocks. Put illustrative checkboxes in fenced code blocks.
4. Record decisions in `## Decisions` and what you verified in
   `## Verification` — commands, results, screenshots, click-throughs.
5. **Done means:** every task ticked, `## Verification` written, an
   `agent_run` history line appended. Then set `station: Done`. With
   `needs_human: true` set `ready: true` instead, write `## Review` (below)
   and leave the spec in `Doing` — the human accepts and moves it to
   `Done`, without moving files.
6. Too big after all? Split into child specs (`parent:`), leave the parent
   in `Doing` with the remaining tasks, and say so in the body.

### Asking for acceptance

When you set `ready: true` on a spec with `needs_human: true`, write a
`## Review` section (before `## Questions`) with what the human has to verify
**themselves** — what they see, click and feel in the real product, with real
hosts or data. Do not repeat what your tests already prove. Name the build to
check and put what cannot be checked here (other platforms, other machines)
into one plain line:

```text
## Review

Build: 7d4c9c9 · local app
Not part of this acceptance: Windows

### R1 · Terminal survives a restart
- Given: "Terminals survive app restarts" is on, an agent runs in the project window
- When: you quit the app with ⌘Q and open it again
- Then: the terminal re-attaches and shows its last output
- [ ] ok
```

One check per `### R<n> · title`, one line each for Given/When/Then, exactly
one checkbox; free text below is fine. Usually one to five checks. These
checkboxes are not tasks — the board counts them separately. The app shows
the section as an acceptance box; the human ticks the checks and accepts, or
writes a finding `### B<n> · bo · <ts>` under check `R<n>` and sends the spec
back (`ready: false`). Then work through every finding, adjust the affected
checks and untick them, leave the findings in place, and set `ready: true`
again only when all are addressed.

### Asking the human

Prefer asking in the chat and waiting. If a run has to end without an answer,
append to the spec body:

```text
## Questions

### Q1 · open · 2026-09-09T10:00:00Z
The question, one paragraph.
```

and set `open_question: Q1` in the front matter (always the oldest open
question). To address one person, append `· an: <email>` to the heading
(`### Q1 · open · <ts> · an: mh@example.com`); their board highlights it.
When the human answers (`### A1 · bo · <ts>`), copy the outcome
into `## Decisions` and clear or advance `open_question`. Question numbers
are never reused. `needs_human` stays untouched by answers — it marks human
acceptance, not an open question.

### Spec history — you write it

The app only logs what it changes itself. Append one JSON line per event to
`.agent/specs/<slug>/history.jsonl`:

```json
{"timestamp":"2026-09-09T10:00:00Z","spec_id":"my-spec","event_type":"agent_run","actor":"project","summary":"Tasks 3–5: …; skills: speccify"}
```

`event_type` ∈ `spec_created | spec_edited | station_changed | agent_run`;
token and duration fields belong to `agent_run` lines only. Name the skills
and tools you used in `summary`.
Use an actor label permitted by the project's provenance rules. Include
token/duration measurements only when actually available; do not invent them.

### Project actions

`.agent/actions.json` is a versioned catalog: `{"version":2,"actions":[…]}`.
Each action has a stable `id`, name, command alias, argv templates and typed
inputs. Humans, MCP callers and event bindings use the same definitions and
input validation. Arguments are data, without a shell; put command chains in
a script. Preserve unknown fields and legacy command aliases. Never append an
array over a versioned catalog. Local approval is held by the app, never by a
`confirmed` flag in this file. Proposals cannot approve themselves.

After updates, use the `project-migrate` skill for compatibility issues.
Safe local migrations run before new agent sessions or through the migration
panel/MCP; customized files remain for review. Keep terminal working directory
and selected content source distinct. CLI installation is an explicit app
action. Migrations do not activate automation or restart running terminals.

### Shared spec register (team)

When `.agent/specs` is a Git worktree of the branch `specs` (a `.git` *file*
inside it), the specs are the team's shared register: the same path for
everyone, independent of the code branch. Edit specs and playbooks there as
usual. The
Speccify app commits and syncs the register (commit → fetch → rebase → push,
never force). Do not commit inside `.agent/specs` yourself while the app is
running; without the app, run `git -C .agent/specs add -A && git -C
.agent/specs commit -m "spec(<id>): …" && git -C .agent/specs pull --rebase
&& git -C .agent/specs push`, never `--force`. A stopped rebase with conflict
markers in a `SPEC.md` is a human decision: report it, do not resolve it
silently. In a fresh clone without the worktree, mount it with
`git worktree add .agent/specs origin/specs` (the app offers the same under
"Einrichten"). Never add `.agent/specs` to a code branch commit.

### Owner and branch (team)

A spec in `Doing` may carry `owner: Name <email>` (the Git identity of the
person who took it) and `branch: spec/<NNN>-<slug>` (the code branch of that
work). Read both before you start: do not take or work a spec owned by
someone else unless the human asked you to. Do not switch branches silently;
if the checkout is not on the spec's branch, say so and ask. Name the spec id
and the branch in commit message bodies. Never invent these fields — the app
sets them on take-over (Backlog/Next → Doing) and clears `owner` on release
or when work moves from `Doing` back to `Backlog` or `Next`.

### Asking through the app UI

When the Speccify app runs, the `speccify-desktop-ui` MCP lets you ask the
human directly instead of guessing: `ask_bo` for a quick choice
(buttons), checkboxes (multi_select) or a short question list (form);
`show_ui` for anything richer — an HTML fragment with Tailwind classes that
the app renders (previews, tables, custom forms). A `<form>` submit or a
click on an element with `data-answer` returns the values to you. Reusable
UIs live in a skill under `.agent/skills/<name>/ui/*.html` and are shown
with `file`. See the skill `agent-ui`. Never block on a question the human
already answered in the spec or in the chat.

### Rules

- Never write secrets into `.agent/settings.json`, `.mcp.json`,
  `.codex/config.toml`, or any tracked file.
- Mention the spec id (`012-slug`) in commit message bodies when you commit.
- Commit/push only within explicit authorization, including standing project
  permissions. This default does not revoke permissions already granted.
<!-- speccify:workflow:end -->
