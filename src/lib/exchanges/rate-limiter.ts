interface RateLimiterConfig {
  maxRequests: number
  windowMs: number
}

const EXCHANGE_LIMITS: Record<string, RateLimiterConfig> = {
  coinbase: { maxRequests: 10, windowMs: 1000 },
  binance: { maxRequests: 20, windowMs: 1000 },
  kraken: { maxRequests: 15, windowMs: 1000 },
  gemini: { maxRequests: 10, windowMs: 1000 },
}

export class RateLimiter {
  private timestamps: number[] = []
  private config: RateLimiterConfig

  constructor(exchange: string) {
    this.config = EXCHANGE_LIMITS[exchange] ?? { maxRequests: 10, windowMs: 1000 }
  }

  async throttle(): Promise<void> {
    const now = Date.now()
    this.timestamps = this.timestamps.filter(t => t > now - this.config.windowMs)

    if (this.timestamps.length >= this.config.maxRequests) {
      const oldestInWindow = this.timestamps[0]
      const waitMs = oldestInWindow + this.config.windowMs - now
      if (waitMs > 0) {
        await new Promise(resolve => setTimeout(resolve, waitMs))
      }
    }

    this.timestamps.push(Date.now())
  }
}
