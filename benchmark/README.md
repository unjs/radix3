# Benchmark Results

Benchmarks are mainly focusing on benchmarking `lookup` method performance.

Below results are based on my personal PC using WSL2. You can use provided scripts to test in your own env.

## Direct benchmark

Directly benchmarking `lookup` performance using [benchmark](https://www.npmjs.com/package/benchmark)

Scripts:

- `pnpm bench`
- `pnpm bench:profile` (using [0x](https://www.npmjs.com/package/0x) to generate flamegraph)

```
--- Test environment ---

Node.js version: 14.18.1
Radix3 version: 0.1.0
OS: linux
CPU count: 16
Current load: [ 0.07, 0.09, 0.16 ]


--- static route ---

lookup x 117,219,957 ops/sec ±0.29% (96 runs sampled)
Stats:
 - /choot: 609847174

--- dynamic route ---

lookup x 1,365,609 ops/sec ±0.64% (88 runs sampled)
Stats:
 - /choot/123: 7074324
```

## HTTP Benchmark

Using [`autocannon`](https://github.com/mcollina/autocannon) and a simple http listener using lookup for realworld performance.

Scripts:

- `pnpm bench:http`

```
--- Test environment ---

Node.js version: 14.18.1
Radix3 version: 0.1.0
OS: linux
CPU count: 16
Current load: [ 0.43, 0.19, 0.19 ]


--- Benchmark: static route ---

Running 10s test @ http://localhost:3000/
10 connections

┌─────────┬──────┬──────┬───────┬──────┬─────────┬────────┬───────┐
│ Stat    │ 2.5% │ 50%  │ 97.5% │ 99%  │ Avg     │ Stdev  │ Max   │
├─────────┼──────┼──────┼───────┼──────┼─────────┼────────┼───────┤
│ Latency │ 0 ms │ 0 ms │ 0 ms  │ 0 ms │ 0.01 ms │ 0.1 ms │ 10 ms │
└─────────┴──────┴──────┴───────┴──────┴─────────┴────────┴───────┘
┌───────────┬─────────┬─────────┬─────────┬─────────┬──────────┬─────────┬─────────┐
│ Stat      │ 1%      │ 2.5%    │ 50%     │ 97.5%   │ Avg      │ Stdev   │ Min     │
├───────────┼─────────┼─────────┼─────────┼─────────┼──────────┼─────────┼─────────┤
│ Req/Sec   │ 20783   │ 20783   │ 28191   │ 28335   │ 27356.37 │ 2105.53 │ 20780   │
├───────────┼─────────┼─────────┼─────────┼─────────┼──────────┼─────────┼─────────┤
│ Bytes/Sec │ 2.91 MB │ 2.91 MB │ 3.95 MB │ 3.96 MB │ 3.83 MB  │ 295 kB  │ 2.91 MB │
└───────────┴─────────┴─────────┴─────────┴─────────┴──────────┴─────────┴─────────┘

Req/Bytes counts sampled once per second.

301k requests in 11.01s, 42.1 MB read
Stats:
 - /choot: 300910

--- Benchmark: dynamic route ---

Running 10s test @ http://localhost:3000/
10 connections

┌─────────┬──────┬──────┬───────┬──────┬─────────┬─────────┬──────┐
│ Stat    │ 2.5% │ 50%  │ 97.5% │ 99%  │ Avg     │ Stdev   │ Max  │
├─────────┼──────┼──────┼───────┼──────┼─────────┼─────────┼──────┤
│ Latency │ 0 ms │ 0 ms │ 0 ms  │ 1 ms │ 0.02 ms │ 0.12 ms │ 3 ms │
└─────────┴──────┴──────┴───────┴──────┴─────────┴─────────┴──────┘
┌───────────┬─────────┬─────────┬─────────┬─────────┬──────────┬────────┬─────────┐
│ Stat      │ 1%      │ 2.5%    │ 50%     │ 97.5%   │ Avg      │ Stdev  │ Min     │
├───────────┼─────────┼─────────┼─────────┼─────────┼──────────┼────────┼─────────┤
│ Req/Sec   │ 19023   │ 19023   │ 23311   │ 23439   │ 22883.64 │ 1237.9 │ 19010   │
├───────────┼─────────┼─────────┼─────────┼─────────┼──────────┼────────┼─────────┤
│ Bytes/Sec │ 3.23 MB │ 3.23 MB │ 3.96 MB │ 3.98 MB │ 3.89 MB  │ 211 kB │ 3.23 MB │
└───────────┴─────────┴─────────┴─────────┴─────────┴──────────┴────────┴─────────┘

Req/Bytes counts sampled once per second.

252k requests in 11s, 42.8 MB read
Stats:
 - /choot/123: 251690
```
