export function runBalanceFeel() {
  console.log('BALANCE_FEEL_OK placeholder');
}

if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  runBalanceFeel();
}
