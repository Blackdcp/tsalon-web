import fs from 'fs';
const envFile = fs.readFileSync('.env', 'utf-8');
const lines = envFile.split('\n');
for (const line of lines) {
  if (line.startsWith('REDIS_URL=')) {
    process.env.REDIS_URL = line.substring(10).trim().replace(/^"/, '').replace(/"$/, '');
  }
}
import { kv } from './src/lib/kv';
async function main() {
  if (!kv) {
    console.log("No KV!");
    return;
  }
  const data = await kv.get('user:154967851:data');
  console.log('Base Data:', data);
  const keys = await kv.keys('user:154967851:timeseries:*');
  console.log('Timeseries keys:', keys);
  for (const key of keys) {
      const events = await kv.lrange(key, 0, -1);
      console.log('Key:', key, 'Count:', events.length);
      console.log('Sample:', events[0]);
  }
  process.exit(0);
}
main().catch(console.error);
