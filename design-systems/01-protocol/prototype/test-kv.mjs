import Redis from 'ioredis';
const kv = new Redis(process.env.REDIS_URL);
const keys = await kv.keys("user:*:data");
for (const k of keys) {
  const data = await kv.get(k);
  console.log(k, data);
}
const lb = await kv.zrange("leaderboard:total", 0, -1, "WITHSCORES");
console.log("Leaderboard:", lb);
process.exit(0);
