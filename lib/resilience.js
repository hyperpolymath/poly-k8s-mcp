// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell
// resilience.js - JavaScript wrapper for resilience patterns

/**
 * Circuit Breaker implementation
 */
export class CircuitBreaker {
  constructor(options = {}) {
    this.threshold = options.threshold || 5;
    this.resetTimeout = options.resetTimeout || 30000;
    this.halfOpenMaxCalls = options.halfOpenMaxCalls || 3;
    this.state = "closed";
    this.failures = 0;
    this.lastFailure = 0;
    this.successCount = 0;
  }

  shouldAllow() {
    if (this.state === "closed") return true;
    if (this.state === "open") {
      if (Date.now() - this.lastFailure > this.resetTimeout) {
        this.state = "half-open";
        this.successCount = 0;
        return true;
      }
      return false;
    }
    // half-open
    return this.successCount < this.halfOpenMaxCalls;
  }

  recordSuccess() {
    if (this.state === "half-open") {
      this.successCount++;
      if (this.successCount >= this.halfOpenMaxCalls) {
        this.state = "closed";
        this.failures = 0;
      }
    } else {
      this.failures = 0;
    }
  }

  recordFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.threshold) {
      this.state = "open";
    }
  }

  reset() {
    this.state = "closed";
    this.failures = 0;
    this.successCount = 0;
  }

  getStatus() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailure: this.lastFailure,
      threshold: this.threshold,
    };
  }
}

/**
 * LRU Cache with TTL
 */
export class Cache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 100;
    this.defaultTtl = options.defaultTtl || 60000;
    this.entries = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  get(key) {
    const entry = this.entries.get(key);
    if (!entry) {
      this.misses++;
      return undefined;
    }
    if (entry.expires < Date.now()) {
      this.entries.delete(key);
      this.misses++;
      return undefined;
    }
    entry.hits++;
    this.hits++;
    // Move to end for LRU
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.value;
  }

  set(key, value, ttl = this.defaultTtl) {
    // Evict oldest if at capacity
    if (this.entries.size >= this.maxSize) {
      const oldestKey = this.entries.keys().next().value;
      this.entries.delete(oldestKey);
    }
    this.entries.set(key, {
      value,
      expires: Date.now() + ttl,
      hits: 0,
    });
  }

  has(key) {
    const entry = this.entries.get(key);
    return entry && entry.expires > Date.now();
  }

  delete(key) {
    return this.entries.delete(key);
  }

  clear() {
    this.entries.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.entries.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff(operation, options = {}) {
  const maxAttempts = options.maxAttempts || 3;
  const baseDelay = options.baseDelay || 1000;
  const maxDelay = options.maxDelay || 30000;
  const multiplier = options.multiplier || 2;

  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        const delay = Math.min(baseDelay * Math.pow(multiplier, attempt - 1), maxDelay);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

/**
 * Health Check System
 */
export class HealthChecker {
  constructor() {
    this.checks = new Map();
    this.overallStatus = "healthy";
  }

  register(name, checkFn) {
    this.checks.set(name, {
      name,
      checkFn,
      status: "healthy",
      message: "Not yet checked",
      lastCheck: 0,
      consecutiveFailures: 0,
    });
  }

  async runCheck(name) {
    const check = this.checks.get(name);
    if (!check) return;

    try {
      const result = await check.checkFn();
      check.status = result.status || "healthy";
      check.message = result.message || "OK";
      check.consecutiveFailures = check.status === "healthy" ? 0 : check.consecutiveFailures + 1;
    } catch (error) {
      check.status = "unhealthy";
      check.message = error.message;
      check.consecutiveFailures++;
    }
    check.lastCheck = Date.now();
    this.updateOverallStatus();
  }

  async runAllChecks() {
    const promises = [];
    for (const name of this.checks.keys()) {
      promises.push(this.runCheck(name));
    }
    await Promise.all(promises);
    return this.getReport();
  }

  updateOverallStatus() {
    let hasUnhealthy = false;
    let hasDegraded = false;
    for (const check of this.checks.values()) {
      if (check.status === "unhealthy") hasUnhealthy = true;
      if (check.status === "degraded") hasDegraded = true;
    }
    this.overallStatus = hasUnhealthy ? "unhealthy" : hasDegraded ? "degraded" : "healthy";
  }

  getReport() {
    const checks = [];
    for (const check of this.checks.values()) {
      checks.push({
        name: check.name,
        status: check.status,
        message: check.message,
        lastCheck: check.lastCheck,
        consecutiveFailures: check.consecutiveFailures,
      });
    }
    return {
      status: this.overallStatus,
      timestamp: Date.now(),
      checks,
    };
  }
}

/**
 * Metrics Collector
 */
export class MetricsCollector {
  constructor() {
    this.totalCalls = 0;
    this.successfulCalls = 0;
    this.failedCalls = 0;
    this.cachedCalls = 0;
    this.responseTimes = [];
    this.lastError = null;
    this.lastErrorTime = null;
    this.adapterMetrics = new Map();
  }

  recordCall(adapter, { success, cached, responseTime }) {
    this.totalCalls++;
    if (success) this.successfulCalls++;
    else this.failedCalls++;
    if (cached) this.cachedCalls++;
    this.responseTimes.push(responseTime);
    // Keep last 1000 response times
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }

    // Per-adapter metrics
    if (!this.adapterMetrics.has(adapter)) {
      this.adapterMetrics.set(adapter, { calls: 0, successes: 0, failures: 0 });
    }
    const am = this.adapterMetrics.get(adapter);
    am.calls++;
    if (success) am.successes++;
    else am.failures++;
  }

  recordError(error) {
    this.lastError = error.message || String(error);
    this.lastErrorTime = Date.now();
  }

  getReport() {
    const avgResponseTime =
      this.responseTimes.length > 0
        ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
        : 0;

    const adapters = {};
    for (const [name, m] of this.adapterMetrics) {
      adapters[name] = {
        calls: m.calls,
        successRate: m.calls > 0 ? m.successes / m.calls : 1,
      };
    }

    return {
      totalCalls: this.totalCalls,
      successfulCalls: this.successfulCalls,
      failedCalls: this.failedCalls,
      cachedCalls: this.cachedCalls,
      successRate: this.totalCalls > 0 ? this.successfulCalls / this.totalCalls : 1,
      cacheHitRate: this.totalCalls > 0 ? this.cachedCalls / this.totalCalls : 0,
      avgResponseTimeMs: avgResponseTime,
      lastError: this.lastError,
      lastErrorTime: this.lastErrorTime,
      adapters,
    };
  }
}

/**
 * Fallback Registry
 */
export class FallbackRegistry {
  constructor() {
    this.fallbacks = [];
  }

  register(name, priority, isAvailable, execute) {
    this.fallbacks.push({ name, priority, isAvailable, execute });
    this.fallbacks.sort((a, b) => a.priority - b.priority);
  }

  async execute(args) {
    for (const fb of this.fallbacks) {
      if (fb.isAvailable()) {
        try {
          return await fb.execute(args);
        } catch (error) {
          // Try next fallback
          continue;
        }
      }
    }
    throw new Error("All fallbacks exhausted");
  }

  getAvailable() {
    return this.fallbacks.filter((fb) => fb.isAvailable()).map((fb) => fb.name);
  }
}

/**
 * Self-Healing Coordinator
 */
export class SelfHealer {
  constructor(options = {}) {
    this.checkInterval = options.checkInterval || 30000;
    this.actions = [];
    this.isRunning = false;
    this.intervalId = null;
  }

  register(name, condition, action, cooldown = 60000) {
    this.actions.push({
      name,
      condition,
      action,
      cooldown,
      lastRun: 0,
    });
  }

  async runCheck() {
    const results = [];
    const now = Date.now();

    for (const action of this.actions) {
      if (action.condition() && now - action.lastRun > action.cooldown) {
        try {
          const success = await action.action();
          action.lastRun = now;
          results.push({ action: action.name, success });
        } catch (error) {
          results.push({ action: action.name, success: false, error: error.message });
        }
      }
    }
    return results;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.intervalId = setInterval(() => this.runCheck(), this.checkInterval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }
}

/**
 * Resilient Adapter Wrapper
 * Wraps any adapter with circuit breaker, caching, retry, and metrics
 */
export class ResilientAdapter {
  constructor(adapter, options = {}) {
    this.adapter = adapter;
    this.name = adapter.name || "unknown";
    this.circuitBreaker = new CircuitBreaker(options.circuitBreaker);
    this.cache = new Cache(options.cache);
    this.retryOptions = options.retry || {};
    this.metrics = options.metricsCollector || new MetricsCollector();
    this.healthChecker = options.healthChecker;

    // Register health check if available
    if (this.healthChecker && adapter.healthCheck) {
      this.healthChecker.register(this.name, () => adapter.healthCheck());
    }
  }

  async execute(toolName, args, options = {}) {
    const startTime = Date.now();
    const cacheKey = options.cacheKey || `${toolName}:${JSON.stringify(args)}`;
    const cacheable = options.cacheable !== false;

    // Check cache first
    if (cacheable) {
      const cached = this.cache.get(cacheKey);
      if (cached !== undefined) {
        this.metrics.recordCall(this.name, {
          success: true,
          cached: true,
          responseTime: Date.now() - startTime,
        });
        return cached;
      }
    }

    // Check circuit breaker
    if (!this.circuitBreaker.shouldAllow()) {
      const error = new Error(`Circuit breaker open for ${this.name}`);
      this.metrics.recordError(error);
      throw error;
    }

    try {
      // Execute with retry
      const result = await retryWithBackoff(
        () => this.adapter.handleToolCall(toolName, args),
        this.retryOptions
      );

      this.circuitBreaker.recordSuccess();

      // Cache successful result
      if (cacheable && result.TAG === "Ok") {
        this.cache.set(cacheKey, result, options.ttl);
      }

      this.metrics.recordCall(this.name, {
        success: result.TAG === "Ok",
        cached: false,
        responseTime: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      this.circuitBreaker.recordFailure();
      this.metrics.recordError(error);
      this.metrics.recordCall(this.name, {
        success: false,
        cached: false,
        responseTime: Date.now() - startTime,
      });
      throw error;
    }
  }
}

/**
 * Create diagnostic MCP tools
 */
export function createDiagnosticTools(components) {
  const { healthChecker, metrics, caches, circuitBreakers } = components;

  return {
    mcp_health_check: {
      name: "mcp_health_check",
      description: "Get health status of all adapters and connections",
      inputSchema: { type: "object", properties: {} },
      handler: async () => {
        if (healthChecker) {
          return await healthChecker.runAllChecks();
        }
        return { status: "unknown", message: "Health checker not configured" };
      },
    },

    mcp_metrics: {
      name: "mcp_metrics",
      description: "Get performance metrics and statistics",
      inputSchema: { type: "object", properties: {} },
      handler: async () => {
        if (metrics) {
          return metrics.getReport();
        }
        return { message: "Metrics not configured" };
      },
    },

    mcp_cache_stats: {
      name: "mcp_cache_stats",
      description: "Get cache statistics and hit rates",
      inputSchema: { type: "object", properties: {} },
      handler: async () => {
        const stats = {};
        if (caches) {
          for (const [name, cache] of Object.entries(caches)) {
            stats[name] = cache.getStats();
          }
        }
        return stats;
      },
    },

    mcp_circuit_status: {
      name: "mcp_circuit_status",
      description: "Get circuit breaker states for all adapters",
      inputSchema: { type: "object", properties: {} },
      handler: async () => {
        const status = {};
        if (circuitBreakers) {
          for (const [name, cb] of Object.entries(circuitBreakers)) {
            status[name] = cb.getStatus();
          }
        }
        return status;
      },
    },

    mcp_clear_cache: {
      name: "mcp_clear_cache",
      description: "Clear the response cache",
      inputSchema: {
        type: "object",
        properties: {
          adapter: { type: "string", description: "Optional: specific adapter cache to clear" },
        },
      },
      handler: async (args) => {
        if (!caches) return { success: false, message: "No caches configured" };

        if (args.adapter && caches[args.adapter]) {
          caches[args.adapter].clear();
          return { success: true, cleared: args.adapter };
        }

        for (const cache of Object.values(caches)) {
          cache.clear();
        }
        return { success: true, cleared: "all" };
      },
    },

    mcp_reset_circuit: {
      name: "mcp_reset_circuit",
      description: "Reset a circuit breaker to closed state",
      inputSchema: {
        type: "object",
        properties: {
          adapter: { type: "string", description: "Adapter name to reset" },
        },
        required: ["adapter"],
      },
      handler: async (args) => {
        if (!circuitBreakers || !circuitBreakers[args.adapter]) {
          return { success: false, message: `Unknown adapter: ${args.adapter}` };
        }
        circuitBreakers[args.adapter].reset();
        return { success: true, adapter: args.adapter, state: "closed" };
      },
    },
  };
}
