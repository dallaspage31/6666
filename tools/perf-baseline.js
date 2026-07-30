export function runPerfBaseline() {
  const t0 = Date.now();
  let sum = 0;
  for (let i = 0; i < 100000; i++) sum += i;
  const dt = Date.now() - t0;
  console.log(`PERF_BASELINE_OK loop=${dt}ms`);
}

if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  runPerfBaseline();
}
