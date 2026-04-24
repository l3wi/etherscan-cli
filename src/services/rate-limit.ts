export class RateLimiter {
  private nextAvailable = 0

  constructor(private readonly rps: number) {}

  async wait() {
    if (!Number.isFinite(this.rps) || this.rps <= 0) return
    const interval = 1000 / this.rps
    const now = Date.now()
    const waitMs = Math.max(0, this.nextAvailable - now)
    this.nextAvailable = Math.max(now, this.nextAvailable) + interval
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs))
    }
  }
}
