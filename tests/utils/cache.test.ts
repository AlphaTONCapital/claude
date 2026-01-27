import { CacheManager } from '../../src/utils/cache.js';

describe('CacheManager', () => {
  let cache: CacheManager;

  beforeEach(() => {
    cache = new CacheManager({
      ttl: 60,
      checkPeriod: 120,
      useRedis: false, // Use in-memory only for tests
    });
  });

  afterEach(async () => {
    await cache.close();
  });

  describe('basic operations', () => {
    it('should store and retrieve values', async () => {
      await cache.set('test-key', { foo: 'bar' });
      const result = await cache.get<{ foo: string }>('test-key');
      expect(result).toEqual({ foo: 'bar' });
    });

    it('should return null for missing keys', async () => {
      const result = await cache.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should delete keys', async () => {
      await cache.set('to-delete', 'value');
      await cache.del('to-delete');
      const result = await cache.get('to-delete');
      expect(result).toBeNull();
    });

    it('should clear all keys', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.clear();

      const result1 = await cache.get('key1');
      const result2 = await cache.get('key2');

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe('TTL handling', () => {
    it('should use default TTL', async () => {
      await cache.set('default-ttl', 'value');
      const result = await cache.get('default-ttl');
      expect(result).toBe('value');
    });

    it('should use custom TTL when specified', async () => {
      await cache.set('custom-ttl', 'value', 1);
      const result = await cache.get('custom-ttl');
      expect(result).toBe('value');
    });
  });

  describe('multiple key operations', () => {
    it('should get multiple keys at once', async () => {
      await cache.set('mget1', 'value1');
      await cache.set('mget2', 'value2');
      await cache.set('mget3', 'value3');

      const results = await cache.mget<string>(['mget1', 'mget2', 'mget3', 'nonexistent']);

      expect(results.size).toBe(3);
      expect(results.get('mget1')).toBe('value1');
      expect(results.get('mget2')).toBe('value2');
      expect(results.get('mget3')).toBe('value3');
      expect(results.has('nonexistent')).toBe(false);
    });

    it('should set multiple keys at once', async () => {
      const entries = new Map<string, string>([
        ['mset1', 'value1'],
        ['mset2', 'value2'],
      ]);

      await cache.mset(entries);

      const result1 = await cache.get('mset1');
      const result2 = await cache.get('mset2');

      expect(result1).toBe('value1');
      expect(result2).toBe('value2');
    });
  });

  describe('stats', () => {
    it('should return cache statistics', async () => {
      await cache.set('stats-key', 'value');
      const stats = cache.getStats();

      expect(stats).toHaveProperty('nodeCache');
      expect(stats).toHaveProperty('redis');
      expect(stats).toHaveProperty('keys');
      expect(stats.keys).toBeGreaterThanOrEqual(1);
    });
  });

  describe('data types', () => {
    it('should handle string values', async () => {
      await cache.set('string', 'hello');
      expect(await cache.get('string')).toBe('hello');
    });

    it('should handle number values', async () => {
      await cache.set('number', 42);
      expect(await cache.get('number')).toBe(42);
    });

    it('should handle boolean values', async () => {
      await cache.set('boolean-true', true);
      await cache.set('boolean-false', false);
      expect(await cache.get('boolean-true')).toBe(true);
      expect(await cache.get('boolean-false')).toBe(false);
    });

    it('should handle object values', async () => {
      const obj = { nested: { deep: 'value' }, arr: [1, 2, 3] };
      await cache.set('object', obj);
      expect(await cache.get('object')).toEqual(obj);
    });

    it('should handle array values', async () => {
      const arr = [1, 'two', { three: 3 }];
      await cache.set('array', arr);
      expect(await cache.get('array')).toEqual(arr);
    });

    it('should handle null values', async () => {
      await cache.set('null-value', null);
      // null stored should come back as null (not undefined)
      const result = await cache.get('null-value');
      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle empty string keys', async () => {
      await cache.set('', 'empty-key-value');
      const result = await cache.get('');
      expect(result).toBe('empty-key-value');
    });

    it('should handle very long keys', async () => {
      const longKey = 'a'.repeat(1000);
      await cache.set(longKey, 'long-key-value');
      const result = await cache.get(longKey);
      expect(result).toBe('long-key-value');
    });

    it('should handle special characters in keys', async () => {
      const specialKey = 'key:with:colons:and/slashes/and spaces';
      await cache.set(specialKey, 'special-key-value');
      const result = await cache.get(specialKey);
      expect(result).toBe('special-key-value');
    });

    it('should handle large values', async () => {
      const largeValue = 'x'.repeat(100000);
      await cache.set('large', largeValue);
      const result = await cache.get('large');
      expect(result).toBe(largeValue);
    });
  });
});

describe('getWithMetadata', () => {
  let cache: CacheManager;

  beforeEach(() => {
    cache = new CacheManager({
      ttl: 60,
      checkPeriod: 120,
      useRedis: false,
    });
  });

  afterEach(async () => {
    await cache.close();
  });

  it('should return found=true with value and source for cache hit', async () => {
    await cache.set('meta-key', { data: 'test' });
    const result = await cache.getWithMetadata<{ data: string }>('meta-key');

    expect(result.found).toBe(true);
    expect(result.value).toEqual({ data: 'test' });
    expect(result.source).toBe('memory');
    expect(result.error).toBeUndefined();
  });

  it('should return found=false with source=none for cache miss', async () => {
    const result = await cache.getWithMetadata('nonexistent-key');

    expect(result.found).toBe(false);
    expect(result.value).toBeUndefined();
    expect(result.source).toBe('none');
    expect(result.error).toBeUndefined();
  });
});

describe('cached decorator', () => {
  it('should be a function that returns a decorator', async () => {
    const { cached } = await import('../../src/utils/cache.js');
    expect(typeof cached).toBe('function');
    const decorator = cached(60);
    expect(typeof decorator).toBe('function');
  });
});
