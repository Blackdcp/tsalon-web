import { Redis } from 'ioredis';
import fs from 'fs';

let redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  const envFile = fs.readFileSync('.env', 'utf-8');
  for (const line of envFile.split('\n')) {
    if (line.startsWith('REDIS_URL=')) {
      redisUrl = line.split('=')[1].replace(/"/g, '');
    }
  }
}

const kv = redisUrl ? new Redis(redisUrl) : null;

async function main() {
  if (!kv) {
    console.log("No REDIS_URL");
    return;
  }
  
  const userIds = await kv.zrevrange('leaderboard:total', 0, -1);
  console.log("Found users in leaderboard:", userIds);
  
  for (const id of userIds) {
    const data = await kv.get(`user:${id}:data`);
    if (data) {
      const parsed = JSON.parse(data);
      console.log(`- ID: ${id}, Name: ${parsed.name}, Tokens: ${parsed.tokens?.total}, Updated: ${parsed.updatedAt}`);
    } else {
      console.log(`- ID: ${id} (No data found)`);
    }
  }
  process.exit(0);
}

main();
