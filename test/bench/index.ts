import { bench, group as describe, run } from "mitata";
import { requests } from "./input";
import { createInstances } from "./impl";

const instances = createInstances();

const fullTests = process.argv.includes("--full");

describe("param routes", () => {
  const nonStaticRequests = requests.filter((r) => r.data.includes(":"));
  for (const [name, _find] of instances) {
    bench(name, () => {
      for (const request of nonStaticRequests) {
        _find(request.method, request.path);
      }
    });
  }
});

if (fullTests) {
  describe("param and static routes", () => {
    for (const [name, _find] of instances) {
      bench(name, () => {
        for (const request of requests) {
          _find(request.method, request.path);
        }
      });
    }
  });

  for (const request of requests) {
    describe(`[${request.method}] ${request.path}`, () => {
      for (const [name, _find] of instances) {
        bench(name, () => {
          _find(request.method, request.path);
        });
      }
    });
  }
}

await run();

console.log(`
Tips:
- Run with --full to run all tests
- Run with --max to compare with maximum possible performance
`);
