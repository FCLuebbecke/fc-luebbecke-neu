---
name: project-migrate
description: Inspect and migrate a project's Speccify actions and workflow after an update, repair a missing CLI through the app, and reconcile customized legacy files without losing local changes. Use for migration prompts, old actions.json, CLI compatibility warnings or unresolved update steps.
metadata:
  speccify-workflow-version: "1"
---

# Project migration

Read the selected source's `.agent/agent.md` first. Honor the current task,
existing authorization, project rules and local changes. A migration is not
permission to run actions or activate automation.

## Inspect

Keep two paths distinct: `project` is the terminal working directory;
`source_project` is the explicitly selected content source containing
`.agent`. Read the workspace context to obtain them. Never infer another
source, combine sources, or initialize the terminal directory just because
it lacks `.agent`.

With the running desktop MCP, call `project_migration_get` using both paths
when a source is selected. Without one, omit `source_project`. Read each
step, its revision, issues and proposed action. Read-only diagnosis changes
nothing. Without this MCP, use the app's migration panel or inspect files;
do not claim an unavailable command succeeded.

## Safe migration

For authorized compatibility work, call `project_migration_apply` with
the exact returned `revision` as `expected_revision`. It applies only
safe local steps, then diagnoses again. A stale revision requires a fresh
read, not a forced overwrite. Repeating the same completed migration should
make no changes. Inspect `errors` and remaining issues even after success.

- Legacy actions are arrays. The current document is
  `{"version":2,"actions":[...]}`; preserve every action, input, extension
  field and toolbar/shortcut setting. Use the common migration to derive
  stable IDs and retain an original-byte backup. Do not hand-rewrite the
  catalog when the native migration is available.
- Inputs are named strings validated by the shared planner. `argv` stores
  argument templates; substitute inputs only after splitting legacy commands,
  never interpolate a command and parse it again. File/folder values are
  paths; their content is not implicitly loaded.
- Old `confirmed` flags in project files do not establish a local approval.
  Migration must not invent approval records, extend the exec allowlist,
  activate events or send work to Codex/Claude. The owner confirms actions
  and event bindings in Actions & Automation.
- Exact older shipped workflow templates may be upgraded automatically.
  Preserve custom/newer/unknown files. Do not remove project rules or
  overwrite host-adapter files to make a warning disappear.

## Resolve remaining issues

Read the affected file and the current shipped schema/template. For a
customized file, prepare the smallest merge preserving the user's meaning.
Create a recoverable original copy before an authorized edit; compare the
file with the bytes read immediately before writing. If changed, reread.
If intent is ambiguous, show the concrete conflicting passages and ask.
Apply clearly authorized compatibility fixes without repeated permission.

A missing/outdated bundled CLI uses the app's **Install CLI** / **Update CLI**
button. This explicit network installation is separate from project
migration. Normal agent sessions and configured MCPs can work without the
Python CLI; skill expansion, export, linking and tool checks require it.
Do not run `uv sync` in an unrelated project or change the user's global
Python installation. Do not stop running terminals to repair the CLI.

## Verify and report

After an action-array migration, its original-byte backup is under
`.agent/backups/actions-<previous project-actions step revision>.json`.
The aggregate API returns postcheck status; verify that backup path before
including it in the report. Never infer that a backup exists from success alone.

Read migration status again and validate the changed definitions. Report
what migrated, backup locations and remaining manual issues. Do not mark
everything complete merely because a writer or installer returned success.
Do not run saved actions just to test a migration. Use disposable fixtures
for execution checks; changed automation needs manual preview and risk
confirmation. Keep pending approvals and real-host verification visible.
