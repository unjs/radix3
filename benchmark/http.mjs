/* eslint-disable no-console */

import autocannon from "autocannon"; // https://github.com/mcollina/autocannon
import { listen } from "listhen";
import {
  printEnv,
  benchSets,
  printStats,
  logSection,
  router,
} from "./utils.mjs";

async function main() {
  printEnv();

  for (const bench of benchSets) {
    logSection(`Benchmark: ${bench.title}`);
    const { listener, stats } = await createServer();
    const instance = autocannon({
      url: listener.url,
      requests: bench.requests,
    });
    autocannon.track(instance);
    process.once("SIGINT", () => {
      instance.stop();
      listener.close();
      process.exit(1);
    });
    await instance; // Resolves to details results
    printStats(stats);
    await listener.close();
  }
}

// eslint-disable-next-line unicorn/prefer-top-level-await
main().catch(console.error);

async function createServer() {
  const stats = {};
  const listener = await listen(
    (req, res) => {
      stats[req.url] = (stats[req.url] || 0) + 1;
      const match = router.lookup(
        req.url,
        req.url.endsWith("get") ? { method: "GET" } : undefined
      );
      if (!match) {
        stats[match] = (stats[match] || 0) + 1;
      }
      res.end(JSON.stringify(match || { error: 404 }));
    },
    { showURL: false }
  );

  return { listener, stats };
}
