# AGENTS.md

## First Message

If the user did not give you a concrete task in their first message, read `agents/task.md` to get the core objectives outlined in the file.

## Project Context
This is a modern Node.js backend/CLI project using **TypeScript**. 
It utilizes `tsx` for seamless TypeScript execution and the **native Node.js Test Runner** (`node:test`) for testing. 
This project uses the `pnpm` package manager and `package.json` for dependency management and configuration. The target Node.js version is >= 20. All commands must be run using `pnpm` or `node`.

## Agent Instructions
When working on this project, the agent **MUST** adhere to the following rules:

- **ALWAYS** use `pnpm <command>` instead of invoking `npm`, `yarn`, or other tools directly for package management.
- **NEVER** use `npm install` or `yarn install`.
- **ALWAYS** run `pnpm install` to install/update dependencies after changes to `package.json`.
- **ALWAYS** run quality checks (`format`, `lint`, `test`) before proposing any changes.
- **MAINTAIN** existing code formatting and style, primarily enforced by `eslint` and `prettier` (or `biome` if configured).
- **PREFER** using modern ESM syntax (`import`/`export`) over CommonJS (`require`).
- **USE** `tsx` to execute TypeScript files directly during development.
- **USE** the native `node:test` and `node:assert` modules for writing tests. DO NOT introduce Jest or Vitest unless explicitly requested.

## Useful Commands (for the AI Agent)

- **Install dependencies**: `pnpm install`
- **Run a script directly**: `pnpm exec tsx src/index.ts`
- **Run tests**: `pnpm run test` (Executes `node --import tsx --test tests/`)
- **Run tests in watch mode**: `pnpm run test:watch`
- **Run linting**: `pnpm run lint`
- **Run type checking**: `pnpm run typecheck` (Executes `tsc --noEmit`)
- **Build project**: `pnpm run build` (Compiles TS to JS in `dist/` directory)
- **Add a new package**: `pnpm add <package-name>`
- **Add a dev dependency**: `pnpm add -D <package-name>`
- **Remove a package**: `pnpm remove <package-name>`

## Project Structure
- `src/`: Contains all application-level TypeScript code.
- `agents/`: Contains AI agent operational logs, learnings, errors, and task records for self-improvement and context management.
- `tests/`: Contains all unit and integration tests (using `node:test`).
- `dist/` or `build/`: The output directory for compiled JavaScript (ignored in git).
- `package.json`: The main configuration and dependency file.
- `tsconfig.json`: TypeScript compiler configuration.
- `AGENTS.md`: This file, providing context and instructions.

## AI Agent Self-Improvement
Log learnings and errors to markdown files for continuous improvement. Coding agents can later process these into fixes, and important learnings get promoted to project memory.

### Quick Reference

| Situation | Action |
|-----------|--------|
| Command/operation fails | Log to `agents/ERRORS.md` |
| User corrects you | Log to `agents/LEARNINGS.md` with category `correction` |
| API/external tool fails | Log to `agents/ERRORS.md` with integration details |
| Knowledge was outdated | Log to `agents/LEARNINGS.md` with category `knowledge_gap` |
| A better approach was found | Log to `agents/LEARNINGS.md` with category `best_practice` |
| Simplify/Harden recurring patterns | Log/update `agents/LEARNINGS.md` with `Source: simplify-and-harden` and a stable `Pattern-Key` |
| Similar to an existing entry | Link with `**See Also**`, consider bumping its priority |
| Complete a task | Log to `agents/LOGS.md` |

### Logging Format

#### Learning Entry

Append to `agents/LEARNINGS.md`:

```markdown
## [LRN-YYYYMMDD-XXX] category

### Summary
One-line description of what was learned

### Details
Full context: what happened, what was wrong, what is correct

### Suggested Action
Specific fix or improvement to implement

---
```

#### Error Entry

Append to `agents/ERRORS.md`:

```markdown
## [ERR-YYYYMMDD-XXX] skill_or_command_name

### Summary
Brief description of what failed

### Error
Actual error message or output

### Context
- Command/operation attempted
- Input or parameters used
- Environment details (if relevant)
- Summary or redacted excerpt of relevant output (avoid full transcripts and secret-bearing data by default)

### Suggested Fix
If identifiable, what would resolve this issue

---
```

#### LOG Entry

Append to `agents/LOGS.md`:

```markdown
## [LOG-YYYYMMDD-XXX] Task Name

### Overview
Briefly describe what was done and what problem was solved.

### Details
- Key point 1
- Key point 2
- Key point 3

### Results
- Achievements / Outputs
- Remaining or follow-up items

---
```

### Periodic Review

Review `agents/` at natural breakpoints:

#### When to Review
- Before starting a new major task
- After completing a feature
- When working in an area with past learnings
- Weekly during active development

### Recurring Pattern Detection

If logging something similar to an existing entry:

1. **Search first**: `grep -r "keyword" agents/`
2. **Link entries**: Add `**See Also**: ERR-20250110-001` in metadata
3. **Bump priority** if the issue keeps recurring

### Best Practices

1. **Log immediately** — context is freshest right after the issue
2. **Be specific** — future agents need to understand quickly
3. **Include reproduction steps** — especially for errors
4. **Link related files** — makes fixes easier
5. **Suggest concrete fixes** — not just "investigate"
6. **Use consistent categories** — enables filtering
7. **Promote aggressively** — if in doubt, add to `agents/AGENTS.md`
8. **Review regularly** — stale learnings lose value
