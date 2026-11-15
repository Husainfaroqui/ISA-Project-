import { defineConfig } from "vitest/config";
// `npm test` runs unit tests only. API tests need a running PostgREST + PostgreSQL: use `npm run test:api` (see README).
export default defineConfig({ test: { exclude: ["node_modules/**", "tests/api/**", "dist/**"] } });
