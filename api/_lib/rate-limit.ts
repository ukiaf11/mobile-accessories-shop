/**
 * Rate limiting for the public request endpoints (blueprint 02 section 8, 08 section 3).
 *
 * Two tiers:
 *   1. Upstash Redis when `UPSTASH_REDIS_REST_URL` / `..._TOKEN` are set — correct across
 *      every serverless instance, which is what a real deployment needs.
 *   2. An in-memory sliding window otherwise. Per-instance only, so a determined attacker
 *      spread across cold starts gets more than the nominal budget. It is a speed bump for
 *      the common case, not a security boundary — hence the console warning.
 */

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

const WINDOW_SECONDS = 600; // 10 minutes
const MAX_REQUESTS = 8;

const memory = new Map<string, number[]>();
let warnedAboutMemory = false;

export function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip =
    forwarded?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  return `mas:rl:${ip}`;
}

export async function checkRateLimit(key: string): Promise<RateLimitResult> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    try {
      return await upstashLimit(upstashUrl, upstashToken, key);
    } catch (error) {
      // A limiter outage must not take the order form down with it.
      console.error('[rate-limit] upstash unavailable, falling back to memory:', error);
    }
  } else if (!warnedAboutMemory) {
    warnedAboutMemory = true;
    console.warn(
      '[rate-limit] Using per-instance in-memory limiting. ' +
      'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for a shared limiter.',
    );
  }

  return memoryLimit(key);
}

function memoryLimit(key: string): RateLimitResult {
  const now = Date.now();
  const cutoff = now - WINDOW_SECONDS * 1000;
  const hits = (memory.get(key) ?? []).filter((stamp) => stamp > cutoff);

  if (hits.length >= MAX_REQUESTS) {
    const oldest = hits[0];
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + WINDOW_SECONDS * 1000 - now) / 1000)),
    };
  }

  hits.push(now);
  memory.set(key, hits);

  // Opportunistic sweep so a long-lived instance does not grow unbounded.
  if (memory.size > 5000) {
    for (const [entryKey, stamps] of memory) {
      if (stamps.every((stamp) => stamp <= cutoff)) memory.delete(entryKey);
    }
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

async function upstashLimit(url: string, token: string, key: string): Promise<RateLimitResult> {
  // INCR + EXPIRE in one pipeline: a fixed window, which is enough for abuse control
  // and avoids the round trips a true sliding window would cost.
  const response = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', key],
      ['EXPIRE', key, String(WINDOW_SECONDS), 'NX'],
      ['TTL', key],
    ]),
  });

  if (!response.ok) throw new Error(`upstash responded ${response.status}`);

  const results = (await response.json()) as Array<{ result: number }>;
  const count = Number(results[0]?.result ?? 0);
  const ttl = Number(results[2]?.result ?? WINDOW_SECONDS);

  return count > MAX_REQUESTS
    ? { allowed: false, retryAfterSeconds: ttl > 0 ? ttl : WINDOW_SECONDS }
    : { allowed: true, retryAfterSeconds: 0 };
}

export const RATE_LIMIT = { WINDOW_SECONDS, MAX_REQUESTS };
