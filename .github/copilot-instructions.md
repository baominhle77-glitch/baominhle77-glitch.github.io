# Repository instructions for GitHub Copilot and coding agents

Before making any change, read and follow `AGENTS.md` in the repository root.

Mandatory rules:

1. Read `HANDOVER.md`, `docs/handover/ACTIVE_TASKS.json` and `docs/handover/NHAT-KY-PHOI-HOP.md` before editing.
2. Do not edit a path currently locked by another active task.
3. Work on a dedicated branch; do not push agent changes directly to `main`.
4. One pull request equals one Task-ID. Include a line `Task-ID: AREA-YYYYMMDD-NN` in the PR body.
5. Keep changed files inside the registered task paths.
6. Update the handoff log and task ledger in every code pull request.
7. Never commit passwords, tokens, encryption keys, Worker secrets, private chat data or decrypted source payloads.
8. Treat `backend/wrangler.toml` and repository workflows as the Cloudflare configuration source of truth.
9. Deploy Pages before Worker when frontend/API contracts change, then run production smoke checks.
10. Run `node tools/validate-coordination.mjs` and all relevant tests; state precisely what was and was not tested.

If instructions conflict, use the priority order in `AGENTS.md`. Stop and mark the task `blocked` rather than broadening the scope or overwriting another agent's work.