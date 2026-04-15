# Pull Request Guide

## What is a Pull Request (PR)?

A Pull Request is a way to propose changes to a codebase. Think of it as saying: *"Hey team, I made some changes on my branch — can someone review them before we merge into main?"*

It's the standard collaboration mechanism on **GitHub**.

---

## The Complete Flow (One Issue = One Branch = One PR)

A key rule to always follow:

> **For every GitHub Issue you work on, create a new dedicated branch. When done, push your changes and open a PR on GitHub. The reviewer merges it into main.**
```
main branch  ──────────────────────────────────────► (stable, production-ready)
                    │                        ▲
                    │ 1. branch off          │ 4. reviewer merges after approval
                    ▼                        │
feature branch ──────────────────────────────
       │                    │
       │ 2. work on issue   │ 3. push changes + open PR on GitHub
       │    commit changes  │    → reviewer checks the code
       └────────────────────┘
```

---

## The Lifecycle of a GitHub Issue → PR → Merge

**1. Pick up a GitHub Issue**
Go to your repo on GitHub → **Issues tab** → pick an issue assigned to you (e.g. Issue #42 "Add user authentication")

**2. Create a fresh branch from main — one branch per issue**
```bash
git checkout main
git pull origin main
git checkout -b feature/issue-42-user-authentication
```
>  Name your branch after the GitHub Issue number so it's traceable — e.g. `fix/issue-7-login-bug` or `feat/issue-42-auth`

**3. Work on the issue & commit regularly**
```bash
git add .
git commit -m "feat: add user authentication endpoint (#42)"
```

**4. When done, push your branch to GitHub**
```bash
git push origin feature/issue-42-user-authentication
```

**5. Open a PR on GitHub**
- Go to your repo on GitHub (e.g. `github.com/webeet-io/application-agent`)
- Click the **"Pull requests"** tab in the top navigation
- Click the green **"New pull request"** button
- Set the **base branch** to `main` and the **compare branch** to your feature branch (e.g. `feature/issue-42-user-authentication`)
- Click **"Create pull request"**
- Fill in the PR description (see template below)
- Assign a **Reviewer** on the right sidebar
- Type `Closes #42` in the description to link the GitHub Issue automatically
- Click **"Create Pull Request"** to submit it

**6. Reviewer checks the PR on GitHub**
- They read the code diff, leave inline comments, and either **approve** or **request changes**
- If changes are requested: fix them locally, commit, and push to the same branch — the PR updates automatically
```bash
git add .
git commit -m "fix: address review comments"
git push origin feature/issue-42-user-authentication
```

**7. Reviewer approves & merges into main on GitHub**
- Once everything looks good, the reviewer clicks **"Merge pull request"** on GitHub
- Select **"Merge commit"**
- Delete the branch after merging using the **"Delete branch"** button GitHub shows — the linked GitHub Issue closes automatically 

---

## PR Description Template
```markdown
## What changed
Brief summary of what you did and why.

## How to test
1. Step one
2. Step two
3. Expected result

## Screenshots (if UI changed)
Before | After
-------|------
img    | img

## Linked Issue
Closes #42
```

---

## Golden Rules

- **One GitHub Issue = one branch = one PR** — never mix multiple issues in one branch.
- **Keep PRs small** — one feature or fix per PR. Nobody wants to review 1,000 lines.
- **Self-review first** — go to the **"Files changed"** tab in your GitHub PR and read your own diff before requesting review.
- **Don't take feedback personally** — GitHub review comments are about the code, not you.
- **Never push directly to `main`** — always go through a GitHub PR.
- **Respond to every GitHub comment** — either fix it, or use the **"Resolve conversation"** button with an explanation.
- **Always link the issue** — use `Closes #<issue-number>` so GitHub tracks everything automatically.

---

> The PR is not just a technical tool — it's your **communication channel with the team** on GitHub. A well-written PR saves everyone time and builds trust in your work.