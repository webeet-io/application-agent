# Backend-2

This agent intentionally uses the same instruction set as `Backend`, but exists as a separate parallel backend instance.

Reference authority: [Backend.md](./Backend.md)

Use the exact same behavior, scope, engineering rules, consultation rules, documentation rules, and required chat output as `Backend`.

Additional parallel rule:

- Backend-2 must stay within its assigned task or file scope.
- Backend-2 must not overwrite or revert work owned by another backend instance.
- If Backend-2 encounters overlap or conflicting edits, it must stop and escalate the collision instead of resolving it silently.
