# Repository Guidelines

## Project Structure & Module Organization
This repository is currently a clean scaffold: no application code, tests, or assets have been committed yet. Keep the top level minimal and organize new work under clear directories as features are added:

- `src/` for application code
- `tests/` for automated tests
- `assets/` for static files such as images, audio clips, or icons
- `docs/` for design notes, architecture decisions, and onboarding material

Prefer feature-oriented structure inside `src/`, for example `src/player/`, `src/library/`, and `src/shared/`.

## Build, Test, and Development Commands
No build system is configured yet. When tooling is introduced, expose it through repeatable project-level commands and document them here. Recommended defaults:

- `npm install` to install dependencies
- `npm run dev` to start local development
- `npm run build` to create a production build
- `npm test` to run the full test suite
- `npm run lint` to check formatting and code quality

If this project uses a different stack later, keep command names consistent so contributors do not need to learn custom workflows.

## Coding Style & Naming Conventions
Use 2-space indentation for JavaScript, TypeScript, JSON, and Markdown. Name files and folders consistently:

- `PascalCase` for React components or class-based modules
- `camelCase` for functions and variables
- `kebab-case` for route files, scripts, and asset names

Adopt a formatter and linter early. If using the typical web stack, prefer Prettier for formatting and ESLint for static analysis.

## Testing Guidelines
Place unit and integration tests in `tests/` or beside source files using `*.test.*` naming, such as `player.test.ts`. Add tests for all new features and bug fixes. Aim for meaningful coverage of core flows rather than superficial line-count targets.

## Commit & Pull Request Guidelines
Git history is not available in this workspace, so no repository-specific commit convention can be inferred. Use Conventional Commits going forward, for example `feat: add queue controls` or `fix: handle missing album art`.

Pull requests should include:

- a short summary of the change
- linked issue or task reference when applicable
- test notes describing what was verified
- screenshots or recordings for UI changes

## Configuration & Security
Do not commit secrets, API keys, or personal credentials. Store local configuration in ignored files such as `.env.local`, and provide a checked-in `.env.example` once environment variables are introduced.

## Agent Workflow
Before modifying any code, the agent must:

1. Analyze the request.
2. Propose a step-by-step plan.
3. Wait for explicit approval before making file changes.

Every proposed change must explain:

- which files will change
- why the change is needed
- potential side effects or behavioral risks

Before any planned change, show this mini-workflow first:

1. What will be done?
2. Which files will be touched?
3. Why exactly these files?

If requirements are unclear, ask precise follow-up questions instead of guessing. Mark every assumption explicitly with `Assumption:`.

The system should consult [agents/Orchestrator.md](./agents/Orchestrator.md) as the default routing authority for multi-agent work.
Specialist agents may still be explicitly mentioned by the user, but cross-domain routing should follow the orchestrator rules by default.

## Language & Communication
Respond to the user in German. Keep code, identifiers, and code comments in English.

Use a direct, professional tone. Do not invent facts. If something is uncertain, state that clearly.

When the expected reasoning effort increases from medium to high or extra high, announce that first with a short note covering the reason and scope.

## Decision Making
If multiple plausible approaches exist, compare them briefly and give a clear recommendation. Avoid long pro/con lists unless the user explicitly asks for them.

For architecture topics, present the available options, recommend one, and wait for approval before changing files.

## README & Product Documentation
Keep `README` content product-focused: what the product does, who it is for, and how to start or use it.

Do not make internal team process the main content of product documentation. Prefer precise, verifiable statements over buzzwords.

## Tests
Run a self-check after changes by default. Only skip tests when the user explicitly says `skip tests`.

Use mocking only when necessary, and label it clearly when it is introduced.

## Response Format
Use this as the default response format:

- Do not require a fixed opening word or phrase.
- Use `Nächste Schritte sind:` only when you are actually presenting concrete next steps, recommendations, or follow-up actions.
- For general answers, explanations, status updates, or direct responses without follow-up actions, do not include `Nächste Schritte sind:`.
- If next steps are included, format them as `a) ...`, `b) ...`, `c) ...`

If the user explicitly wants a short answer, reply briefly without the extra block.

## Transparency
If the user asks for lines, provide the exact file and line number.

State uncertainty plainly instead of filling gaps with guesses.
