import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",

  // No parallelism — Parabank is a stateful app with a shared HSQLDB instance.
  // Running tests in parallel causes race conditions between fixtures that
  // create accounts or modify balances. A single worker guarantees isolation.
  fullyParallel: false,
  workers: 1,

  // No automatic retries — in fintech QA, flaky tests must be investigated,
  // not silenced with retries. Automatic retries can mask real race conditions
  // in transfer endpoints.
  retries: 0,

  reporter: [
    // HTML for interactive local review after each run
    ["html"],
    // JUnit XML for CI integration and for generate-report.ts
    ["junit", { outputFile: "test-results/results.xml" }],
  ],

  use: {
    // baseURL from environment variable — allows targeting different
    // environments (local, staging) without modifying code.
    baseURL: process.env.BASE_URL || "http://localhost:9090",

    // Trace only on first retry — captures network, DOM, and screenshots
    // without the overhead of enabling it on every run.
    trace: "on-first-retry",

    // Screenshot only on failure — reduces noise in successful runs.
    screenshot: "only-on-failure",

    // Video only on first retry — useful for diagnosing flakiness
    // without accumulating gigabytes of video on normal runs.
    video: "on-first-retry",
  },

  projects: [
    {
      // Chromium only — deliberate scope for a demo portfolio.
      // Cross-browser testing would require additional CI infrastructure
      // outside the scope of this project.
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});