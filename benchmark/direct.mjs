/* eslint-disable no-console */
import Benchmark from "benchmark"; // https://www.npmjs.com/package/benchmark'
import {
  printEnv,
  benchSets,
  printStats,
  router,
  logSection,
} from "./utils.mjs";

async function main() {
  printEnv();

  for (const bench of benchSets) {
    logSection(bench.title);
    const suite = new Benchmark.Suite();
    const stats = {};
    suite.add("lookup", () => {
      for (const req of bench.requests) {
        const match = router.lookup(req.path, { method: req.method });
        if (!match) {
          stats[match] = (stats[match] || 0) + 1;
        }
        stats[req.path] = (stats[req.path] || 0) + 1;
      }
    });
    suite.on("cycle", (event) => {
      console.log(String(event.target));
    });
    const promise = new Promise((resolve) =>
      suite.on("complete", () => resolve())
    );
    suite.run({ async: true });
    await promise;
    printStats(stats);
  }
}

// eslint-disable-next-line unicorn/prefer-top-level-await
main().catch(console.error);
