function redisRange(values, start, stop) {
  const length = values.length;
  const first = start < 0 ? Math.max(0, length + start) : start;
  const last = stop < 0 ? length + stop : stop;
  if (first >= length || last < first) return [];
  return values.slice(first, Math.min(length, last + 1));
}

export class FakeRedis {
  constructor() {
    this.strings = new Map();
    this.hashes = new Map();
    this.lists = new Map();
    this.sortedSets = new Map();
    this.pipelineFailures = new Map();
    this.pipelineChunks = new Map();
  }

  failPipelineAfter(operation, successfulChunks = 1) {
    this.pipelineFailures.set(operation, successfulChunks);
    this.pipelineChunks.set(operation, 0);
  }

  seedHash(key, entries) {
    this.hashes.set(key, new Map(entries));
  }

  hasKey(key) {
    return this.strings.has(key) || this.hashes.has(key) || this.lists.has(key) || this.sortedSets.has(key);
  }

  async get(key) {
    return this.strings.get(key) ?? null;
  }

  async set(key, value, ...args) {
    if (args.includes('NX') && this.hasKey(key)) return null;
    this.strings.set(key, String(value));
    return 'OK';
  }

  async del(...keys) {
    let removed = 0;
    for (const key of keys) {
      if (this.strings.delete(key)) removed += 1;
      if (this.hashes.delete(key)) removed += 1;
      if (this.lists.delete(key)) removed += 1;
      if (this.sortedSets.delete(key)) removed += 1;
    }
    return removed;
  }

  async hgetall(key) {
    return Object.fromEntries(this.hashes.get(key) ?? []);
  }

  async hset(key, ...entries) {
    const hash = this.hashes.get(key) ?? new Map();
    this.hashes.set(key, hash);
    const pairs = entries.length === 1 && entries[0] && typeof entries[0] === 'object'
      ? Object.entries(entries[0])
      : Array.from({ length: entries.length / 2 }, (_, index) => entries.slice(index * 2, index * 2 + 2));
    let added = 0;
    for (const [field, value] of pairs) {
      if (!hash.has(field)) added += 1;
      hash.set(String(field), String(value));
    }
    return added;
  }

  async hdel(key, ...fields) {
    const hash = this.hashes.get(key);
    if (!hash) return 0;
    let removed = 0;
    for (const field of fields) if (hash.delete(field)) removed += 1;
    if (hash.size === 0) this.hashes.delete(key);
    return removed;
  }

  async lrange(key, start, stop) {
    return redisRange(this.lists.get(key) ?? [], start, stop);
  }

  async rpush(key, ...values) {
    const list = this.lists.get(key) ?? [];
    list.push(...values.map(String));
    this.lists.set(key, list);
    return list.length;
  }

  async mget(keys) {
    return Promise.all(keys.map((key) => this.get(key)));
  }

  async zadd(key, score, member) {
    const set = this.sortedSets.get(key) ?? new Map();
    this.sortedSets.set(key, set);
    const added = set.has(String(member)) ? 0 : 1;
    set.set(String(member), Number(score));
    return added;
  }

  async rename(source, destination) {
    let value;
    let store;
    for (const candidate of [this.strings, this.hashes, this.lists, this.sortedSets]) {
      if (candidate.has(source)) {
        value = candidate.get(source);
        store = candidate;
        break;
      }
    }
    if (!store) throw new Error('ERR no such key');
    await this.del(destination);
    store.delete(source);
    store.set(destination, value);
    return 'OK';
  }

  async scan(_cursor, ...args) {
    const matchIndex = args.indexOf('MATCH');
    const pattern = matchIndex >= 0 ? args[matchIndex + 1] : '*';
    const expression = new RegExp(`^${String(pattern).replace(/[.+^${}()|[\]\\]/g, '\\$&').replaceAll('*', '.*').replaceAll('?', '.')}$`);
    const keys = new Set([...this.strings.keys(), ...this.hashes.keys(), ...this.lists.keys(), ...this.sortedSets.keys()]);
    return ['0', [...keys].filter((key) => expression.test(key)).sort()];
  }

  async eval(script, numberOfKeys, ...args) {
    const key = args[0];
    if (!script.includes("redis.call('get', KEYS[1])")) throw new Error('Unsupported FakeRedis EVAL script');
    if (numberOfKeys !== 1) throw new Error('FakeRedis expected one EVAL key');
    if (await this.get(key) !== String(args[1])) return 0;
    return this.del(key);
  }

  pipeline() {
    const commands = [];
    const pipeline = {};
    for (const method of ['del', 'hset', 'hdel', 'rpush']) {
      pipeline[method] = (...args) => {
        commands.push([method, args]);
        return pipeline;
      };
    }
    pipeline.exec = async () => Promise.all(commands.map(async ([method, args]) => {
      const key = args[0];
      const operation = String(key).includes(':tmp:')
        ? (method === 'hset' ? 'replace-hash' : method === 'rpush' ? 'replace-list' : null)
        : null;
      if (operation && this.pipelineFailures.has(operation)) {
        const completed = this.pipelineChunks.get(operation) ?? 0;
        if (completed >= this.pipelineFailures.get(operation)) {
          this.pipelineFailures.delete(operation);
          throw new Error(`Injected ${operation} pipeline failure`);
        }
      }
      try {
        return [null, await this[method](...args)];
      } catch (error) {
        return [error, null];
      }
    })).then((replies) => {
      const first = commands[0];
      const key = first?.[1]?.[0];
      const operation = String(key).includes(':tmp:')
        ? (first[0] === 'hset' ? 'replace-hash' : first[0] === 'rpush' ? 'replace-list' : null)
        : null;
      if (operation && this.pipelineFailures.has(operation)) {
        this.pipelineChunks.set(operation, (this.pipelineChunks.get(operation) ?? 0) + 1);
      }
      return replies;
    }).catch((error) => commands.map(() => [error, null]));
    return pipeline;
  }
}
