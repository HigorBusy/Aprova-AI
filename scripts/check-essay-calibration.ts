import { essayCalibrationBenchmarks } from "../lib/ai/essay-benchmarks";
import { normalizeEssayReview } from "../lib/ai/essay-review";

type CalibrationResult = {
  id: string;
  title: string;
  expected: string;
  score: number;
  passed: boolean;
  notes: string[];
};

const results: CalibrationResult[] = essayCalibrationBenchmarks.map((benchmark) => {
  const review = normalizeEssayReview(benchmark.modelDraft, benchmark.essay);
  const score = review.estimatedScore;
  const passed = score >= benchmark.expectedScoreRange.min && score <= benchmark.expectedScoreRange.max;
  const notes = benchmark.assertions.map((assertion) => {
    const value = review.competencies[assertion.competency].score;
    const ok = value >= assertion.min && value <= assertion.max;
    return `${ok ? "OK" : "FAIL"} ${assertion.competency.toUpperCase()}=${value} expected ${assertion.min}-${assertion.max}`;
  });

  return {
    id: benchmark.id,
    title: benchmark.title,
    expected: `${benchmark.expectedScoreRange.min}-${benchmark.expectedScoreRange.max}`,
    score,
    passed: passed && notes.every((note) => note.startsWith("OK")),
    notes
  };
});

for (const result of results) {
  console.log(`${result.passed ? "PASS" : "FAIL"} ${result.id} | ${result.title}`);
  console.log(`  score=${result.score} expected=${result.expected}`);
  for (const note of result.notes) console.log(`  ${note}`);
}

const failures = results.filter((result) => !result.passed);

if (failures.length > 0) {
  console.error(`\n${failures.length} benchmark(s) outside the expected calibration range.`);
  process.exit(1);
}

console.log("\nAll essay calibration benchmarks passed.");
