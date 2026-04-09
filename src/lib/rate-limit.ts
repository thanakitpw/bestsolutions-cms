import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Fallback gracefully ถ้า env ยังไม่ตั้ง (dev mode)
let ratelimit: Ratelimit | null = null

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute
    analytics: false,
  })
}

// ใช้ใน contact form route
export async function checkRateLimit(ip: string): Promise<{ success: boolean; reset: number }> {
  if (!ratelimit) {
    // Dev mode — ไม่ rate limit
    return { success: true, reset: 0 }
  }
  const { success, reset } = await ratelimit.limit(ip)
  return { success, reset }
}
