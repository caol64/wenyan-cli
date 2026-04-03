import js from "@eslint/js";
import globals from "globals";

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.node,
                ...globals.nodeBuiltin,
            },
        },
        rules: {
            "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }], // 忽略以 _ 开头的未使用的参数
            "no-console": "off",
            "no-debugger": "warn",
        },
    },
    {
        files: ["**/*.test.ts", "**/*.test.js"],
        rules: {
            "no-unused-vars": "off",
        },
    },
];
