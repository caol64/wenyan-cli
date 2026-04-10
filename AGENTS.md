# AGENTS.md

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
