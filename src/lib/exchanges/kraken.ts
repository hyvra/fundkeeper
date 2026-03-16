import crypto from 'crypto'
import { ExchangeAdapter, ExchangeCredentials, RawTrade, RawTransfer, ExchangeBalance } from '@/types/exchange'
import { RateLimiter } from './rate-limiter'

const BASE_URL = 'https://api.kraken.com'

export class KrakenAdapter implements ExchangeAdapter {
  name = 'kraken' as const
  private limiter = new RateLimiter('kraken')

  private sign(path: string, body: string, secret: string, nonce: string): string {
    const sha256 = crypto.createHash('sha256').update(nonce + body).digest()
    const hmac = crypto.createHmac('sha512', Buffer.from(secret, 'base64'))
    hmac.update(Buffer.concat([Buffer.from(path), sha256]))
    return hmac.digest('base64')
  }

  private async signedRequest(
    path: string,
    creds: ExchangeCredentials,
    params: Record<string, string> = {}
  ): Promise<Response> {
    await this.limiter.throttle()
    const nonce = Date.now().toString()
    const body = new URLSearchParams({ nonce, ...params }).toString()
    const signature = this.sign(path, body, creds.apiSecret, nonce)

    return fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'API-Key': creds.apiKey,
        'API-Sign': signature,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })
  }

  async validateCredentials(creds: ExchangeCredentials): Promise<boolean> {
    try {
      const res = await this.signedRequest('/0/private/Balance', creds)
      if (!res.ok) return false
      const data = await res.json()
      return !data.error?.length
    } catch {
      return false
    }
  }

  async fetchTrades(
    creds: ExchangeCredentials,
    cursor?: Record<string, unknown>
  ): Promise<{ trades: RawTrade[], nextCursor?: Record<string, unknown> }> {
    const params: Record<string, string> = {}
    if (cursor?.ofs) params.ofs = String(cursor.ofs)

    const res = await this.signedRequest('/0/private/TradesHistory', creds, params)
    if (!res.ok) throw new Error(`Kraken trades error: ${res.status}`)
    const data = await res.json()

    if (data.error?.length) throw new Error(`Kraken: ${data.error.join(', ')}`)

    const trades: RawTrade[] = []
    const tradesObj = data.result?.trades ?? {}

    for (const [id, t] of Object.entries(tradesObj) as [string, Record<string, unknown>][]) {
      const pair = String(t.pair ?? '')
      const asset = pair.replace(/USD$|USDT$|ZUSD$/, '').replace(/^X/, '')

      trades.push({
        externalId: id,
        timestamp: new Date(Number(t.time) * 1000),
        asset,
        amount: parseFloat(String(t.vol ?? '0')),
        counterAsset: 'USD',
        counterAmount: parseFloat(String(t.cost ?? '0')),
        feeAmount: parseFloat(String(t.fee ?? '0')),
        feeAsset: 'USD',
        side: t.type === 'buy' ? 'buy' : 'sell',
        rawData: { id, ...t as Record<string, unknown> },
      })
    }

    const count = data.result?.count ?? 0
    const currentOfs = Number(cursor?.ofs ?? 0) + Object.keys(tradesObj).length

    return {
      trades,
      nextCursor: currentOfs < count ? { ofs: currentOfs } : undefined,
    }
  }

  async fetchTransfers(
    creds: ExchangeCredentials,
    cursor?: Record<string, unknown>
  ): Promise<{ transfers: RawTransfer[], nextCursor?: Record<string, unknown> }> {
    const transfers: RawTransfer[] = []

    for (const type of ['deposit', 'withdrawal']) {
      const params: Record<string, string> = { type }
      if (cursor?.ofs) params.ofs = String(cursor.ofs)

      const res = await this.signedRequest('/0/private/Ledgers', creds, params)
      if (!res.ok) continue
      const data = await res.json()
      if (data.error?.length) continue

      const ledger = data.result?.ledger ?? {}
      for (const [id, entry] of Object.entries(ledger) as [string, Record<string, unknown>][]) {
        transfers.push({
          externalId: id,
          timestamp: new Date(Number(entry.time) * 1000),
          asset: String(entry.asset ?? '').replace(/^X/, '').replace(/^Z/, ''),
          amount: Math.abs(parseFloat(String(entry.amount ?? '0'))),
          type: type as 'deposit' | 'withdrawal',
          feeAmount: Math.abs(parseFloat(String(entry.fee ?? '0'))),
          feeAsset: String(entry.asset ?? '').replace(/^X/, '').replace(/^Z/, ''),
          rawData: { id, ...entry as Record<string, unknown> },
        })
      }
    }

    return { transfers }
  }

  async fetchBalances(creds: ExchangeCredentials): Promise<ExchangeBalance[]> {
    const res = await this.signedRequest('/0/private/Balance', creds)
    if (!res.ok) throw new Error(`Kraken balance error: ${res.status}`)
    const data = await res.json()
    if (data.error?.length) throw new Error(`Kraken: ${data.error.join(', ')}`)

    return Object.entries(data.result ?? {})
      .filter(([, v]) => parseFloat(String(v)) > 0)
      .map(([k, v]) => ({
        asset: k.replace(/^X/, '').replace(/^Z/, ''),
        available: parseFloat(String(v)),
        hold: 0,
        total: parseFloat(String(v)),
      }))
  }
}
