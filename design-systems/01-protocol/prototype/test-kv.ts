import { getLeaderboard } from './src/lib/kv';

async function run() {
  const all = await getLeaderboard(100, 'all');
  console.log('ALL TIME:');
  console.log(JSON.stringify(all[0].tokens, null, 2));

  const days30 = await getLeaderboard(100, '30d');
  console.log('30 DAYS:');
  if (days30.length > 0) {
    console.log(JSON.stringify(days30[0].tokens, null, 2));
  } else {
    console.log('No data for 30d');
  }
  process.exit(0);
}
run();
