# Copilot Instructions

## Build, test, and lint

- Use `pnpm` for all package management and repo scripts.
- Install dependencies: `pnpm install`
- Lint: `pnpm run lint`
- Type-check: `pnpm run typecheck`
- Build: `pnpm run build`
- Full test suite: `pnpm run test`
- Watch tests: `pnpm run test:watch`
- Run one test file: `pnpm exec node --import tsx --test tests/serve.test.ts`
- Run one test by name: `pnpm exec node --import tsx --test --test-name-pattern "should return health status" tests/serve.test.ts`
- CLI/manual smoke flows already scripted in `package.json`:
  - `pnpm run test:bin`
  - `pnpm run test:serve`
  - `pnpm run test:serverPublish`
  - `pnpm run test:realPublish`

## High-level architecture

- This repository is a thin TypeScript CLI/server layer over `@wenyan-md/core/wrapper`. Rendering, theme management, credential storage, and WeChat publishing are mostly delegated to the core package; repo-local logic mainly handles command wiring, input resolution, and the HTTP server wrapper.
- `src/cli.ts` is the real entrypoint. It defines the `publish`, `render`, `theme`, `serve`, and `credential` commands with Commander, exports `createProgram()` for tests, and only calls `program.parse()` behind `import.meta.main`.
- `src/utils.ts` centralizes content ingestion. Input precedence is **inline argument > file/URL via `--file` > stdin**. File input is normalized with `getNormalizeFilePath()` and returns `absoluteDirPath` so core rendering can resolve relative assets correctly.
- `src/commands/serve.ts` implements the remote publish server used by `wenyan publish --server ...`. The flow is:
  1. `/upload` accepts Markdown, CSS, JSON, and image files into `configDir/uploads`
  2. clients reference uploaded assets via `asset://...`
  3. `/publish` loads an uploaded JSON render payload, rewrites `asset://` references back to temp files, and calls `publishToWechatDraft()`
- The project supports both direct local publish and client-server publish. Local mode calls WeChat APIs from the CLI process; server mode pushes render/publish work to a remote Express server to avoid local IP whitelist issues.

## Key conventions

- Keep the codebase in ESM TypeScript (`"type": "module"`, `moduleResolution: "NodeNext"`). Prefer `import`/`export`, not CommonJS.
- Preserve the current error-handling split:
  - CLI commands should go through the shared `runCommandWrapper()` pattern and exit with code 1 on failure.
  - Server routes should throw `AppError` for expected client errors so the shared JSON error shape stays `{ code: -1, desc }`.
- Preserve user-facing Chinese success/error messages unless there is a strong reason to change them. Tests assert on specific Chinese output and error text.
- When adding input-related behavior, keep the existing precedence rules and do not break stdin-based usage for CI/CD pipelines.
- Server uploads are temporary and live under `configDir/uploads` with a 10-minute TTL cleanup job. Features that rely on uploaded files should fit that lifecycle instead of introducing permanent storage here.
- Publishing assumes Wenyan article metadata conventions from the README: Markdown frontmatter should provide at least `title`, with optional `cover`, `author`, and `source_url`. WeChat publishing also depends on `WECHAT_APP_ID` and `WECHAT_APP_SECRET` unless credentials are managed through the CLI/server credential flow.
- Tests use the native Node test runner (`node:test`) plus `node:assert/strict` and `mock`. Follow the existing style instead of introducing Jest/Vitest.
