const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
}

export function checkRateLimit(key: string, limit = 5, windowMs = 60000): RateLimitResult {
  const now = Date.now();

  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  const entry = rateLimitMap.get(key)!;

  if (now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true };
}

export function resetRateLimit(key: string): void {
  rateLimitMap.delete(key);
}

// تنظيف الذاكرة كل 5 دقائق
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 300000);