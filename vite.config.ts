/// <reference types="vitest" />
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");

    return {
        build: {
        },
        test: {
            // globals: true,
            include: ["tests/**/*.test.js", "tests/**/*.test.ts"],
            env,
        },
    };
});
