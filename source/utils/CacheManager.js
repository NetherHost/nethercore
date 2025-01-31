// Copyright 2025 Nether Host

/**
 * Manages an in-memory cache with optional TTL and size limits
 */
class CacheManager {
  /**
   * Create a new CacheManager
   * @param {Object} options Cache configuration options
   * @param {number} [options.maxSize=1000] Maximum number of entries to store
   * @param {number} [options.defaultTTL=null] Default TTL in milliseconds for entries
   * @param {boolean} [options.autoCleanup=true] Whether to periodically clean expired entries
   * @param {number} [options.cleanupInterval=300000] Interval in ms between cleanup runs
   */
  constructor(options = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || 1000;
    this.defaultTTL = options.defaultTTL || null;
    this.autoCleanup = options.autoCleanup !== false;
    this.cleanupInterval = options.cleanupInterval || 5 * 60 * 1000; // 5 minutes
    this.hits = 0;
    this.misses = 0;

    if (this.autoCleanup) {
      this.startCleanupInterval();
    }
  }

  /**
   * Get a value from the cache
   * @param {string} key Cache key
   * @param {*} [defaultValue=null] Value to return if key not found
   * @returns {*} Cached value or defaultValue
   */
  get(key, defaultValue = null) {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return defaultValue;
    }

    const { value, expiresAt } = entry;

    if (expiresAt && expiresAt < Date.now()) {
      this.cache.delete(key);
      this.misses++;
      return defaultValue;
    }

    this.hits++;
    return value;
  }

  /**
   * Set a value in the cache
   * @param {string} key Cache key
   * @param {*} value Value to cache
   * @param {number} [ttl] TTL in milliseconds, overrides defaultTTL
   */
  set(key, value, ttl = this.defaultTTL) {
    // Enforce size limit by removing oldest entries
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    const expiresAt = ttl ? Date.now() + ttl : null;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Check if a key exists and is not expired
   * @param {string} key Cache key
   * @returns {boolean} Whether key exists and is valid
   */
  has(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats including size, hits, misses
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits / (this.hits + this.misses) || 0,
    };
  }

  /**
   * Delete a key from the cache
   * @param {string} key Cache key
   * @returns {boolean} Whether key was found and deleted
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries from the cache
   */
  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Start the automatic cleanup interval
   * @private
   */
  startCleanupInterval() {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (entry.expiresAt && entry.expiresAt < now) {
          this.cache.delete(key);
        }
      }
    }, this.cleanupInterval);
  }

  /**
   * Stop the automatic cleanup interval
   */
  stopCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

module.exports = CacheManager;
