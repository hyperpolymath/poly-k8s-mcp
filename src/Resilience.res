// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell
// Resilience.res - Shared resilience patterns for poly-*-mcp servers

// ============================================================================
// Types
// ============================================================================

type healthStatus = Healthy | Degraded | Unhealthy

type healthCheck = {
  name: string,
  status: healthStatus,
  message: string,
  lastCheck: float,
  consecutiveFailures: int,
}

type circuitState = Closed | Open | HalfOpen

type circuitBreaker = {
  mutable state: circuitState,
  mutable failures: int,
  mutable lastFailure: float,
  mutable successCount: int,
  threshold: int,
  resetTimeout: float,
  halfOpenMaxCalls: int,
}

type cacheEntry<'a> = {
  value: 'a,
  expires: float,
  hits: int,
}

type retryConfig = {
  maxAttempts: int,
  baseDelay: float,
  maxDelay: float,
  backoffMultiplier: float,
}

type metrics = {
  mutable totalCalls: int,
  mutable successfulCalls: int,
  mutable failedCalls: int,
  mutable cachedCalls: int,
  mutable avgResponseTime: float,
  mutable lastError: option<string>,
  mutable lastErrorTime: option<float>,
}

// ============================================================================
// Circuit Breaker
// ============================================================================

let makeCircuitBreaker = (~threshold=5, ~resetTimeout=30000.0, ~halfOpenMaxCalls=3) => {
  state: Closed,
  failures: 0,
  lastFailure: 0.0,
  successCount: 0,
  threshold,
  resetTimeout,
  halfOpenMaxCalls,
}

let now = () => Js.Date.now()

let shouldAllowRequest = (cb: circuitBreaker) => {
  switch cb.state {
  | Closed => true
  | Open =>
    if now() -. cb.lastFailure > cb.resetTimeout {
      cb.state = HalfOpen
      cb.successCount = 0
      true
    } else {
      false
    }
  | HalfOpen => cb.successCount < cb.halfOpenMaxCalls
  }
}

let recordSuccess = (cb: circuitBreaker) => {
  switch cb.state {
  | HalfOpen =>
    cb.successCount = cb.successCount + 1
    if cb.successCount >= cb.halfOpenMaxCalls {
      cb.state = Closed
      cb.failures = 0
    }
  | _ =>
    cb.failures = 0
  }
}

let recordFailure = (cb: circuitBreaker) => {
  cb.failures = cb.failures + 1
  cb.lastFailure = now()
  if cb.failures >= cb.threshold {
    cb.state = Open
  }
}

let getCircuitState = (cb: circuitBreaker) => {
  switch cb.state {
  | Closed => "closed"
  | Open => "open"
  | HalfOpen => "half-open"
  }
}

// ============================================================================
// Retry with Exponential Backoff
// ============================================================================

let defaultRetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000.0,
  maxDelay: 30000.0,
  backoffMultiplier: 2.0,
}

let calculateDelay = (config: retryConfig, attempt: int) => {
  let delay = config.baseDelay *. Js.Math.pow_float(~base=config.backoffMultiplier, ~exp=float_of_int(attempt - 1))
  Js.Math.min_float(delay, config.maxDelay)
}

let sleep = (ms: float) => {
  Js.Promise.make((~resolve, ~reject as _) => {
    let _ = Js.Global.setTimeout(() => resolve(.), int_of_float(ms))
  })
}

let retryWithBackoff = async (config: retryConfig, operation: unit => promise<result<'a, string>>) => {
  let rec loop = async (attempt: int) => {
    let result = await operation()
    switch result {
    | Ok(value) => Ok(value)
    | Error(err) =>
      if attempt >= config.maxAttempts {
        Error(err)
      } else {
        let delay = calculateDelay(config, attempt)
        let _ = await sleep(delay)
        await loop(attempt + 1)
      }
    }
  }
  await loop(1)
}

// ============================================================================
// LRU Cache with TTL
// ============================================================================

type cache<'a> = {
  mutable entries: Js.Dict.t<cacheEntry<'a>>,
  maxSize: int,
  defaultTtl: float,
  mutable hits: int,
  mutable misses: int,
}

let makeCache = (~maxSize=100, ~defaultTtl=60000.0) => {
  entries: Js.Dict.empty(),
  maxSize,
  defaultTtl,
  hits: 0,
  misses: 0,
}

let cacheGet = (cache: cache<'a>, key: string) => {
  switch Js.Dict.get(cache.entries, key) {
  | Some(entry) if entry.expires > now() =>
    cache.hits = cache.hits + 1
    Some(entry.value)
  | Some(_) =>
    // Expired - remove it
    let _ = Js.Dict.unsafeDeleteKey(. cache.entries, key)
    cache.misses = cache.misses + 1
    None
  | None =>
    cache.misses = cache.misses + 1
    None
  }
}

let cacheSet = (cache: cache<'a>, key: string, value: 'a, ~ttl=?) => {
  let actualTtl = switch ttl {
  | Some(t) => t
  | None => cache.defaultTtl
  }

  // Simple size check - evict oldest if needed
  let keys = Js.Dict.keys(cache.entries)
  if Js.Array.length(keys) >= cache.maxSize {
    // Remove first key (simple eviction)
    switch keys[0] {
    | Some(oldKey) => {
        let _ = Js.Dict.unsafeDeleteKey(. cache.entries, oldKey)
      }
    | None => ()
    }
  }

  Js.Dict.set(cache.entries, key, {
    value,
    expires: now() +. actualTtl,
    hits: 0,
  })
}

let cacheClear = (cache: cache<'a>) => {
  cache.entries = Js.Dict.empty()
  cache.hits = 0
  cache.misses = 0
}

let cacheStats = (cache: cache<'a>) => {
  let total = cache.hits + cache.misses
  let hitRate = if total > 0 { float_of_int(cache.hits) /. float_of_int(total) } else { 0.0 }
  {
    "size": Js.Array.length(Js.Dict.keys(cache.entries)),
    "maxSize": cache.maxSize,
    "hits": cache.hits,
    "misses": cache.misses,
    "hitRate": hitRate,
  }
}

// ============================================================================
// Health Check System
// ============================================================================

type healthChecker = {
  mutable checks: array<healthCheck>,
  mutable overallStatus: healthStatus,
}

let makeHealthChecker = () => {
  checks: [],
  overallStatus: Healthy,
}

let registerCheck = (hc: healthChecker, name: string) => {
  let check = {
    name,
    status: Healthy,
    message: "Not yet checked",
    lastCheck: 0.0,
    consecutiveFailures: 0,
  }
  hc.checks = Js.Array.concat([check], hc.checks)
}

let updateCheck = (hc: healthChecker, name: string, status: healthStatus, message: string) => {
  hc.checks = Js.Array.map(check => {
    if check.name == name {
      let failures = switch status {
      | Healthy => 0
      | _ => check.consecutiveFailures + 1
      }
      {
        ...check,
        status,
        message,
        lastCheck: now(),
        consecutiveFailures: failures,
      }
    } else {
      check
    }
  }, hc.checks)

  // Update overall status
  let hasUnhealthy = Js.Array.some(c => c.status == Unhealthy, hc.checks)
  let hasDegraded = Js.Array.some(c => c.status == Degraded, hc.checks)

  hc.overallStatus = if hasUnhealthy {
    Unhealthy
  } else if hasDegraded {
    Degraded
  } else {
    Healthy
  }
}

let getHealthReport = (hc: healthChecker) => {
  let statusString = switch hc.overallStatus {
  | Healthy => "healthy"
  | Degraded => "degraded"
  | Unhealthy => "unhealthy"
  }

  {
    "status": statusString,
    "timestamp": now(),
    "checks": Js.Array.map(check => {
      let checkStatus = switch check.status {
      | Healthy => "healthy"
      | Degraded => "degraded"
      | Unhealthy => "unhealthy"
      }
      {
        "name": check.name,
        "status": checkStatus,
        "message": check.message,
        "lastCheck": check.lastCheck,
        "consecutiveFailures": check.consecutiveFailures,
      }
    }, hc.checks),
  }
}

// ============================================================================
// Metrics Collection
// ============================================================================

let makeMetrics = () => {
  totalCalls: 0,
  successfulCalls: 0,
  failedCalls: 0,
  cachedCalls: 0,
  avgResponseTime: 0.0,
  lastError: None,
  lastErrorTime: None,
}

let recordCall = (m: metrics, ~success: bool, ~cached: bool, ~responseTime: float) => {
  m.totalCalls = m.totalCalls + 1
  if success {
    m.successfulCalls = m.successfulCalls + 1
  } else {
    m.failedCalls = m.failedCalls + 1
  }
  if cached {
    m.cachedCalls = m.cachedCalls + 1
  }
  // Rolling average
  m.avgResponseTime = (m.avgResponseTime *. float_of_int(m.totalCalls - 1) +. responseTime) /. float_of_int(m.totalCalls)
}

let recordError = (m: metrics, error: string) => {
  m.lastError = Some(error)
  m.lastErrorTime = Some(now())
}

let getMetricsReport = (m: metrics) => {
  let successRate = if m.totalCalls > 0 {
    float_of_int(m.successfulCalls) /. float_of_int(m.totalCalls)
  } else {
    1.0
  }
  let cacheHitRate = if m.totalCalls > 0 {
    float_of_int(m.cachedCalls) /. float_of_int(m.totalCalls)
  } else {
    0.0
  }

  {
    "totalCalls": m.totalCalls,
    "successfulCalls": m.successfulCalls,
    "failedCalls": m.failedCalls,
    "cachedCalls": m.cachedCalls,
    "successRate": successRate,
    "cacheHitRate": cacheHitRate,
    "avgResponseTimeMs": m.avgResponseTime,
    "lastError": m.lastError,
    "lastErrorTime": m.lastErrorTime,
  }
}

// ============================================================================
// Fallback Registry
// ============================================================================

type fallback<'a> = {
  name: string,
  priority: int,
  available: unit => bool,
  execute: 'a => promise<result<string, string>>,
}

type fallbackRegistry<'a> = {
  mutable fallbacks: array<fallback<'a>>,
}

let makeFallbackRegistry = () => {
  fallbacks: [],
}

let registerFallback = (reg: fallbackRegistry<'a>, fallback: fallback<'a>) => {
  reg.fallbacks = Js.Array.concat([fallback], reg.fallbacks)
  // Sort by priority
  reg.fallbacks = Js.Array.sortInPlaceWith((a, b) => a.priority - b.priority, reg.fallbacks)
}

let executeWithFallbacks = async (reg: fallbackRegistry<'a>, args: 'a) => {
  let rec tryNext = async (remaining: array<fallback<'a>>) => {
    switch remaining[0] {
    | None => Error("All fallbacks exhausted")
    | Some(fb) =>
      if fb.available() {
        let result = await fb.execute(args)
        switch result {
        | Ok(v) => Ok(v)
        | Error(_) => await tryNext(Js.Array.sliceFrom(1, remaining))
        }
      } else {
        await tryNext(Js.Array.sliceFrom(1, remaining))
      }
    }
  }
  await tryNext(reg.fallbacks)
}

// ============================================================================
// Self-Healing Coordinator
// ============================================================================

type healingAction = {
  name: string,
  condition: unit => bool,
  action: unit => promise<bool>,
  cooldown: float,
  mutable lastRun: float,
}

type selfHealer = {
  mutable actions: array<healingAction>,
  mutable isRunning: bool,
  checkInterval: float,
}

let makeSelfHealer = (~checkInterval=30000.0) => {
  actions: [],
  isRunning: false,
  checkInterval,
}

let registerHealingAction = (sh: selfHealer, action: healingAction) => {
  sh.actions = Js.Array.concat([action], sh.actions)
}

let runHealingCheck = async (sh: selfHealer) => {
  let currentTime = now()
  let results = []

  for i in 0 to Js.Array.length(sh.actions) - 1 {
    switch sh.actions[i] {
    | Some(action) =>
      if action.condition() && (currentTime -. action.lastRun > action.cooldown) {
        let success = await action.action()
        action.lastRun = currentTime
        let _ = Js.Array.push({"action": action.name, "success": success}, results)
      }
    | None => ()
    }
  }

  results
}

// ============================================================================
// Diagnostic Tools (exposed as MCP tools)
// ============================================================================

let diagnosticTools = {
  "mcp_health_check": {
    "name": "mcp_health_check",
    "description": "Get health status of all adapters and connections",
    "inputSchema": {
      "type": "object",
      "properties": {},
    },
  },
  "mcp_metrics": {
    "name": "mcp_metrics",
    "description": "Get performance metrics and statistics",
    "inputSchema": {
      "type": "object",
      "properties": {},
    },
  },
  "mcp_cache_stats": {
    "name": "mcp_cache_stats",
    "description": "Get cache statistics and hit rates",
    "inputSchema": {
      "type": "object",
      "properties": {},
    },
  },
  "mcp_circuit_status": {
    "name": "mcp_circuit_status",
    "description": "Get circuit breaker states for all adapters",
    "inputSchema": {
      "type": "object",
      "properties": {},
    },
  },
  "mcp_clear_cache": {
    "name": "mcp_clear_cache",
    "description": "Clear the response cache",
    "inputSchema": {
      "type": "object",
      "properties": {
        "adapter": {
          "type": "string",
          "description": "Optional: specific adapter cache to clear",
        },
      },
    },
  },
  "mcp_reset_circuit": {
    "name": "mcp_reset_circuit",
    "description": "Reset a circuit breaker to closed state",
    "inputSchema": {
      "type": "object",
      "properties": {
        "adapter": {
          "type": "string",
          "description": "Adapter name to reset",
        },
      },
      "required": ["adapter"],
    },
  },
}
