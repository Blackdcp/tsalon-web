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
  }

  async get(key) {
    return this.strings.get(key) ?? null;
  }

  async set(key, value) {
    this.strings.set(key, String(value));
    return 'OK';
  }

  async del(...keys) {
    let removed = 0;
    for (const key of keys) {
      if (this.strings.delete(key)) removed += 1;
      if (this.hashes.delete(key)) removed += 1;
      if (this.lists.delete(key)) removed += 1;
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

  async scan(_cursor, ...args) {
    const matchIndex = args.indexOf('MATCH');
    const pattern = matchIndex >= 0 ? args[matchIndex + 1] : '*';
    const expression = new RegExp(`^${String(pattern).replace(/[.+^${}()|[\]\\]/g, '\\$&').replaceAll('*', '.*').replaceAll('?', '.')}$`);
    const keys = new Set([...this.strings.keys(), ...this.hashes.keys(), ...this.lists.keys()]);
    return ['0', [...keys].filter((key) => expression.test(key)).sort()];
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
      try {
        return [null, await this[method](...args)];
      } catch (error) {
        return [error, null];
      }
    }));
    return pipeline;
  }
}
