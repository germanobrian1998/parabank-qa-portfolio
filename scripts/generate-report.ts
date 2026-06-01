import * as fs from "fs";
import * as path from "path";

const xmlPath = path.join(process.cwd(), "test-results", "results.xml");
const outputPath = path.join(process.cwd(), "METRICS.md");

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

const report = `# Suite Metrics — ${date}

> Generated from \`test-results/results.xml\` via \`npx ts-node scripts/generate-report.ts\`

## Summary

| Metric | Value |
|--------|-------|
| Total tests | ${totalTests} |
| Passed | ${passed} |
| Skipped (expected) | ${totalSkipped} |
| Known bugs (\`test.fail()\`) | ${knownBugs} |
| Real failures | ${realFailures} |
| Total duration | ${totalTime.toFixed(1)}s |
| Avg duration per test | ${avgDuration}ms |
| Slowest spec | \`${slowest?.name}\` (${slowest?.time.toFixed(1)}s) |

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
`;

fs.writeFileSync(outputPath, report);
console.log(`✅ METRICS.md generated (${totalTests} tests, ${passed} passed, ${knownBugs} known bugs)`);