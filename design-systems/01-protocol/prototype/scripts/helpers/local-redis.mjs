import { spawn } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import Redis from 'ioredis';

// Dedicated, non-persistent localhost server: never connect tests to REDIS_URL.
export async function startLocalRedis() {
  const candidates = [
    process.env.REDIS_SERVER_BIN,
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Microsoft/WinGet/Links/redis-server.exe'),
    '/usr/bin/redis-server', '/usr/local/bin/redis-server', '/opt/homebrew/bin/redis-server',
  ].filter(Boolean);
  const executable = candidates.find(existsSync);
  if (!executable) throw new Error('Install redis-server or set REDIS_SERVER_BIN to run upload quota tests');
  const listener = net.createServer();
  await new Promise((resolve, reject) => {
    listener.once('error', reject);
    listener.listen(0, '127.0.0.1', resolve);
  });
  const port = listener.address().port;
  await new Promise((resolve) => listener.close(resolve));
  const child = spawn(realpathSync(executable), [
    '--bind', '127.0.0.1', '--port', String(port), '--save', '', '--appendonly', 'no',
  ], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let redis;
  async function stop() {
    redis?.disconnect();
    if (child.exitCode === null && child.signalCode === null && child.pid) {
      const exited = new Promise((resolve) => child.once('exit', resolve));
      child.kill();
      await exited;
    }
  }
  try {
    await new Promise((resolve, reject) => {
      let output = '';
      const timeout = setTimeout(() => reject(new Error(`Redis startup timed out: ${output}`)), 5000);
      const finish = (error) => { clearTimeout(timeout); error ? reject(error) : resolve(); };
      const onData = (chunk) => {
        output += chunk;
        if (output.toLowerCase().includes('ready to accept connections')) finish();
      };
      child.stdout.on('data', onData);
      child.stderr.on('data', onData);
      child.once('error', finish);
      child.once('exit', (code) => finish(new Error(`Redis exited (${code}): ${output}`)));
    });
    redis = new Redis({ host: '127.0.0.1', port, lazyConnect: true, maxRetriesPerRequest: 1 });
    await redis.connect();
    return { redis, stop };
  } catch (error) {
    await stop();
    throw error;
  }
}
