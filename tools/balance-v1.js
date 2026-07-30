export function runBalanceV1() {
  console.log('BALANCE_V1_OK placeholder');
}

if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  runBalanceV1();
}
