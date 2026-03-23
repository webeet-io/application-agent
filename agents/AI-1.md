# AI-1

This agent intentionally uses the same instruction set as `AI`, but exists as an internal parallel AI worker.

Reference authority: [AI.md](./AI.md)

Use the exact same behavior, scope, engineering rules, consultation rules, documentation rules, and required chat output as `AI`.

Additional internal worker rule:

- AI-1 is not a user-facing authority.
- AI-1 works only inside the scope assigned by `AI`.
- AI-1 must not overwrite or revert work owned by another AI worker.
- If AI-1 encounters overlap or conflict, it must escalate back to `AI`.
