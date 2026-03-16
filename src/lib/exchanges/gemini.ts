import crypto from 'crypto'
import { ExchangeAdapter, ExchangeCredentials, RawTrade, RawTransfer, ExchangeBalance } from '@/types/exchange'
import { RateLimiter } from './rate-limiter'

const BASE_URL = 'https://api.gemini.com'

export class GeminiAdapter implements ExchangeAdapter {
  name = 'gemini' as const
  private limiter = new RateLimiter('gemini')

  private async signedRequest(
    path: string,
    creds: ExchangeCredentials,
    params: Record<string, unknown> = {}
  ): Promise<Response> {
    await this.limiter.throttle()
    const nonce = Date.now()
    const payload = { request: path, nonce, ...params }
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64')
    const signature = crypto.createHmac('sha384', creds.apiSecret).update(encodedPayload).digest('hex')

    return fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'X-GEMINI-APIKEY': creds.apiKey,
        'X-GEMINI-PAYLOAD': encodedPayload,
        'X-GEMINI-SIGNATURE': signature,
        'Content-Type': 'text/plain',
      },
    })
  }

  async validateCredentials(creds: ExchangeCredentials): Promise<boolean> {
    try {
      const res = await this.signedRequest('/v1/balances', creds)
      return res.ok
    } catch {
      return false
    }
  }

  async fetchTrades(
    creds: ExchangeCredentials,
    cursor?: Record<string, unknown>
  ): Promise<{ trades: RawTrade[], nextCursor?: Record<string, unknown> }> {
    const trades: RawTrade[] = []
    const symbols = ['btcusd', 'ethusd', 'solusd']
    const timestamp = (cursor?.timestamp as number) ?? undefined

    for (const symbol of symbols) {
      const params: Record<string, unknown> = { symbol, limit_trades: 500 }
      if (timestamp) params.timestamp = timestamp

      const res = await this.signedRequest('/v1/mytrades', creds, params)
      if (!res.ok) continue
      const data = await res.json()

      for (const t of data) {
        const baseAsset = symbol.replace(/usd$/, '').toUpperCase()
        trades.push({
          externalId: String(t.tid),
          timestamp: new Date(t.timestampms),
          asset: baseAsset,
          amount: parseFloat(t.amount),
          counterAsset: 'USD',
          counterAmount: parseFloat(t.amount) * parseFloat(t.price),
          feeAmount: parseFloat(t.fee_amount ?? '0'),
          feeAsset: t.fee_currency ?? 'USD',
          side: t.type === 'Buy' ? 'buy' : 'sell',
          rawData: t,
        })
      }
    }

    const lastTrade = trades[trades.length - 1]
    return {
      trades,
      nextCursor: lastTrade ? { timestamp: lastTrade.timestamp.getTime() } : undefined,
    }
  }

  async fetchTransfers(
    creds: ExchangeCredentials,
    cursor?: Record<string, unknown>
  ): Promise<{ transfers: RawTransfer[], nextCursor?: Record<string, unknown> }> {
    const params: Record<string, unknown> = { limit_transfers: 500 }
    if (cursor?.timestamp) params.timestamp = cursor.timestamp

    const res = await this.signedRequest('/v1/transfers', creds, params)
    if (!res.ok) return { transfers: [] }
    const data = await res.json()

    const transfers: RawTransfer[] = (data ?? []).map((t: Record<string, unknown>) => ({
      externalId: String(t.eid),
      timestamp: new Date(Number(t.timestampms)),
      asset: String(t.currency ?? '').toUpperCase(),
      amount: Math.abs(parseFloat(String(t.amount ?? '0'))),
      type: String(t.type) === 'Deposit' ? 'deposit' as const : 'withdrawal' as const,
      txHash: t.txHash ? String(t.txHash) : undefined,
      toAddress: t.destination ? String(t.destination) : undefined,
      rawData: t,
    }))

    return { transfers }
  }

  async fetchBalances(creds: ExchangeCredentials): Promise<ExchangeBalance[]> {
    const res = await this.signedRequest('/v1/balances', creds)
    if (!res.ok) throw new Error(`Gemini balance error: ${res.status}`)
    const data = await res.json()

    return (data ?? [])
      .filter((b: { amount: string }) => parseFloat(b.amount) > 0)
      .map((b: { currency: string; amount: string; available: string }) => ({
        asset: b.currency.toUpperCase(),
        available: parseFloat(b.available),
        hold: parseFloat(b.amount) - parseFloat(b.available),
        total: parseFloat(b.amount),
      }))
  }
}
