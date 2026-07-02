import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",

  // PARALLELISM — why workers: 1 and fullyParallel: false
  //
  // Parabank uses HSQLDB: an embedded, in-memory database that runs inside
  // the same JVM process as the application. All tests share a single DB
  // instance with no transaction isolation between concurrent requests.
  //
  // Tests in this suite modify shared state: they create accounts, execute
  // transfers, and change balances. Running them in parallel causes race
  // conditions — a transfer test reading a balance may see a value that a
  // concurrent account-creation test has already modified, producing false
  // failures that mask real bugs.
  //
  // workers: 1 is the correct setting for this SUT. It is not a framework
  // limitation — Playwright's worker model, the fixture design, and the API
  // setup pattern are all parallel-safe at the framework level.
  //
  // Parallelism would be re-enabled by one of:
  //   (a) One Docker container per worker — each worker gets its own isolated
  //       Parabank + HSQLDB instance. Requires dynamic port allocation and
  //       a baseURL per worker via workerStorageState or env injection.
  //   (b) PostgreSQL with per-test schema isolation — each test creates its
  //       own schema, runs, then drops it. Not viable with HSQLDB.
  //   (c) API-only tests with no shared UI state — stateless tests can run
  //       in parallel safely; only stateful E2E tests need sequential execution.
  //
  // The microservices fintech framework project (payments-service +
  // accounts-service with PostgreSQL) implements option (b) — each test
  // runs against its own schema via Testcontainers, enabling full parallelism.
  //
  // See docs/testing-methodology.md — "Parallelism and worker configuration"
  // for the full rationale and trade-off analysis.
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
    ["github"],
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
      // Smoke corre primero, como gate, contra la DB recién seedeada —
      // antes de que cualquier otro test (api/, e2e/, edge-cases/) la toque.
      // Sin esto, Playwright recorre los archivos en orden alfabético de
      // carpeta y smoke/ termina corriendo último, validando un estado ya
      // modificado por tests previos en vez del seed original.
      // Ver docs/lessons-learned.md — "Smoke gate ordering" para el caso
      // real que motivó este cambio.
      name: "smoke",
      testMatch: /tests\/smoke\/.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      // Chromium only — deliberate scope for a demo portfolio.
      // Cross-browser testing would require additional CI infrastructure
      // outside the scope of this project.
      name: "chromium",
      testMatch: /tests\/(?!smoke\/).*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["smoke"],
    },
  ],
});