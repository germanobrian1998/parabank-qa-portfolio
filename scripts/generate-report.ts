import * as fs from "fs";
import * as path from "path";

const xmlPath = path.join(process.cwd(), "test-results", "results.xml");
const outputPath = path.join(process.cwd(), "METRICS.md");
const historyPath = path.join(process.cwd(), "metrics-history.json");

if (!fs.existsSync(xmlPath)) {
  console.error("❌ test-results/results.xml not found. Run: npx playwright test");
  process.exit(1);
}

const xml = fs.readFileSync(xmlPath, "utf-8");

// Parse testsuites root attributes
const suitesMatch = xml.match(/<testsuites[^>]*tests="(\d+)"[^>]*failures="(\d+)"[^>]*skipped="(\d+)"[^>]*errors="(\d+)"[^>]*time="([^"]+)"/);
const totalTests = suitesMatch ? parseInt(suitesMatch[1]) : 0;
const totalFailures = suitesMatch ? parseInt(suitesMatch[2]) : 0;
const totalSkipped = suitesMatch ? parseInt(suitesMatch[3]) : 0;
const totalErrors = suitesMatch ? parseInt(suitesMatch[4]) : 0;
const totalTime = suitesMatch ? parseFloat(suitesMatch[5]) : 0;

// Parse individual testsuites
const suiteRegex = /<testsuite name="([^"]+)"[^>]*tests="(\d+)"[^>]*failures="(\d+)"[^>]*skipped="(\d+)"[^>]*time="([^"]+)"[^>]*errors="(\d+)"/g;
const suites: { name: string; tests: number; failures: number; skipped: number; time: number; errors: number }[] = [];
let match;
while ((match = suiteRegex.exec(xml)) !== null) {
  suites.push({
    name: match[1],
    tests: parseInt(match[2]),
    failures: parseInt(match[3]),
    skipped: parseInt(match[4]),
    time: parseFloat(match[5]),
    errors: parseInt(match[6]),
  });
}

// Count known bugs (test.fail())
const knownBugs = (xml.match(/<property name="fail"/g) || []).length;

// Real failures (unexpected)
const realFailures = totalFailures;

// Passed = total - skipped - real failures - errors
const passed = totalTests - totalSkipped - realFailures - totalErrors;

// Slowest spec
const slowest = [...suites].sort((a, b) => b.time - a.time)[0];

// Categorize by path
const apiTests = suites.filter(s => s.name.startsWith("api/")).reduce((sum, s) => sum + s.tests, 0);
const e2eTests = suites.filter(s => s.name.startsWith("e2e/")).reduce((sum, s) => sum + s.tests, 0);
const edgeTests = suites.filter(s => s.name.startsWith("edge-cases/")).reduce((sum, s) => sum + s.tests, 0);
const a11yTests = suites.filter(s => s.name.startsWith("accessibility/")).reduce((sum, s) => sum + s.tests, 0);

const avgDuration = totalTests > 0 ? ((totalTime / totalTests) * 1000).toFixed(0) : "0";
const date = new Date().toISOString().split("T")[0];
const timestamp = new Date().toISOString();

// ─── Delta de métricas ────────────────────────────────────────────────────────

interface MetricsSnapshot {
  timestamp: string;
  totalTests: number;
  passed: number;
  skipped: number;
  realFailures: number;
  knownBugs: number;
  totalTime: number;
}

// Leer historial previo
let previous: MetricsSnapshot | null = null;
if (fs.existsSync(historyPath)) {
  try {
    const history: MetricsSnapshot[] = JSON.parse(fs.readFileSync(historyPath, "utf-8"));
    if (history.length > 0) {
      previous = history[history.length - 1];
    }
  } catch {
    console.warn("⚠️  Could not parse metrics-history.json — starting fresh");
  }
}

// Snapshot actual
const current: MetricsSnapshot = {
  timestamp,
  totalTests,
  passed,
  skipped: totalSkipped,
  realFailures,
  knownBugs,
  totalTime,
};

// Guardar historial (máximo 30 entradas)
let history: MetricsSnapshot[] = [];
if (fs.existsSync(historyPath)) {
  try {
    history = JSON.parse(fs.readFileSync(historyPath, "utf-8"));
  } catch {
    history = [];
  }
}
history.push(current);
if (history.length > 30) history = history.slice(-30);
fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));

// Calcular deltas
function delta(current: number, previous: number | undefined): string {
  if (previous === undefined) return "—";
  const diff = current - previous;
  if (diff === 0) return "→ 0";
  return diff > 0 ? `▲ +${diff}` : `▼ ${diff}`;
}

function deltaTime(current: number, previous: number | undefined): string {
  if (previous === undefined) return "—";
  const diff = current - previous;
  if (Math.abs(diff) < 0.1) return "→ ~0s";
  return diff > 0 ? `▲ +${diff.toFixed(1)}s` : `▼ ${diff.toFixed(1)}s`;
}

function deltaStatus(current: number, previous: number | undefined, lowerIsBetter = false): string {
  if (previous === undefined) return "—";
  const diff = current - previous;
  if (diff === 0) return "→ 0";
  const improved = lowerIsBetter ? diff < 0 : diff > 0;
  const arrow = diff > 0 ? "▲" : "▼";
  const sign = diff > 0 ? "+" : "";
  return `${arrow} ${sign}${diff} ${improved ? "✅" : "⚠️"}`;
}

const prev = previous ?? undefined;

const report = `# Suite Metrics — ${date}

> Generated from \`test-results/results.xml\` via \`npx ts-node scripts/generate-report.ts\`
> Previous run: ${previous ? previous.timestamp : "none (first run)"}

## Summary

| Metric | Current | Delta |
|--------|---------|-------|
| Total tests | ${totalTests} | ${delta(totalTests, prev?.totalTests)} |
| Passed | ${passed} | ${deltaStatus(passed, prev?.passed)} |
| Skipped (expected) | ${totalSkipped} | ${delta(totalSkipped, prev?.skipped)} |
| Known bugs (\`test.fail()\`) | ${knownBugs} | ${delta(knownBugs, prev?.knownBugs)} |
| Real failures | ${realFailures} | ${deltaStatus(realFailures, prev?.realFailures, true)} |
| Total duration | ${totalTime.toFixed(1)}s | ${deltaTime(totalTime, prev?.totalTime)} |
| Avg duration per test | ${avgDuration}ms | — |
| Slowest spec | \`${slowest?.name}\` (${slowest?.time.toFixed(1)}s) | — |

## Delta analysis

${previous ? `
- **Tests added/removed:** ${deltaStatus(totalTests, prev?.totalTests)}
- **Pass rate change:** ${passed} / ${totalTests} vs ${previous.passed} / ${previous.totalTests} (${((passed / totalTests) * 100).toFixed(1)}% vs ${((previous.passed / previous.totalTests) * 100).toFixed(1)}%)
- **New real failures:** ${realFailures > (prev?.realFailures ?? 0) ? `⚠️  ${realFailures - (prev?.realFailures ?? 0)} new unexpected failure(s) — investigate before merging` : "✅ none"}
- **Duration change:** ${deltaTime(totalTime, prev?.totalTime)} ${totalTime > (prev?.totalTime ?? 0) * 1.2 ? "⚠️  >20% slower than previous run" : ""}
`.trim() : "_No previous run to compare against. Delta will appear from the next run._"}

## Coverage by type

| Type | Tests |
|------|-------|
| E2E tests | ${e2eTests} |
| API tests | ${apiTests} |
| Edge case tests | ${edgeTests} |
| Accessibility tests | ${a11yTests} |
| Performance scripts | 3 (k6, not in JUnit) |

## Specs

| Spec | Tests | Time |
|------|-------|------|
${suites.map(s => `| \`${s.name}\` | ${s.tests} | ${s.time.toFixed(1)}s |`).join("\n")}

## Notes

- Tests marked with \`test.fail()\` document known bugs — they are intentional and expected to fail
- The skipped test is a BVA boundary case that requires exact account balance (non-deterministic across runs)
- Performance tests (k6) run separately and are not included in this JUnit report
- Metrics history stored in \`test-results/metrics-history.json\` (last 30 runs)
`;

fs.writeFileSync(outputPath, report);
console.log(`✅ METRICS.md generated (${totalTests} tests, ${passed} passed, ${knownBugs} known bugs)`);
if (previous) {
  console.log(`📊 Delta vs previous run: tests ${delta(totalTests, prev?.totalTests)}, passed ${deltaStatus(passed, prev?.passed)}, failures ${deltaStatus(realFailures, prev?.realFailures, true)}, duration ${deltaTime(totalTime, prev?.totalTime)}`);
} else {
  console.log("📊 No previous run found — delta will appear from the next run");
}