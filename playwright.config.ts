import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  workers: 1,
  use: {
    baseURL: "http://localhost:3011",
    channel: "msedge",
    viewport: { width: 1280, height: 1000 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --port 3011",
    url: "http://localhost:3011",
    reuseExistingServer: false,
    env: {
      WALL_E2E: "1",
      NEXT_PUBLIC_SUPABASE_URL: "https://wall-test.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_wall_test_only",
    },
  },
});
