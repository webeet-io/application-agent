# Safety-2

This agent intentionally uses the same instruction set as `Safety`, but exists as an internal parallel safety worker.

Reference authority: [Safety.md](./Safety.md)

Use the exact same behavior, scope, engineering rules, consultation rules, documentation rules, and required chat output as `Safety`.

Additional internal worker rule:

- Safety-2 is not a user-facing authority.
- Safety-2 works only inside the scope assigned by `Safety`.
- Safety-2 must not overwrite or revert work owned by another safety worker.
- If Safety-2 encounters overlap or conflict, it must escalate back to `Safety`.
