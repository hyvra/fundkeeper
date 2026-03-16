import crypto from 'crypto'
import { ExchangeAdapter, ExchangeCredentials, RawTrade, RawTransfer, ExchangeBalance } from '@/types/exchange'
import { RateLimiter } from './rate-limiter'

const BASE_URL = 'https://api.binance.com'

export class BinanceAdapter implements ExchangeAdapter {
  name = 'binance' as const
  private limiter = new RateLimiter('binance')

  private signQuery(params: Record<string, string>, secret: string): string {
    const query = new URLSearchParams(params).toString()
    const signature = crypto.createHmac('sha256', secret).update(query).digest('hex')
    return `${query}&signature=${signature}`
  }

  private async signedRequest(
    method: string,
    path: string,
    creds: ExchangeCredentials,
    params: Record<string, string> = {}
  ): Promise<Response> {
    await this.limiter.throttle()
    const timestamp = Date.now().toString()
    const allParams = { ...params, timestamp, recvWindow: '5000' }
    const signedQuery = this.signQuery(allParams, creds.apiSecret)

    return fetch(`${BASE_URL}${path}?${signedQuery}`, {
      method,
      headers: { 'X-MBX-APIKEY': creds.apiKey },
    })
  }

  async validateCredentials(creds: ExchangeCredentials): Promise<boolean> {
    try {
      const res = await this.signedRequest('GET', '/api/v3/account', creds)
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
    // Fetch trades for common trading pairs
    const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT']
    const fromId = (cursor?.lastTradeId as string) ?? undefined

    for (const symbol of symbols) {
      const params: Record<string, string> = { symbol, limit: '1000' }
      if (fromId) params.fromId = fromId

      const res = await this.signedRequest('GET', '/api/v3/myTrades', creds, params)
      if (!res.ok) continue
      const data = await res.json()

      for (const t of data) {
        const isBuyer = t.isBuyer
        const baseAsset = symbol.replace(/USDT$|USD$|BUSD$/, '')
        trades.push({
          externalId: String(t.id),
          timestamp: new Date(t.time),
          asset: baseAsset,
          amount: parseFloat(t.qty),
          counterAsset: 'USDT',
          counterAmount: parseFloat(t.quoteQty),
          feeAmount: parseFloat(t.commission),
          feeAsset: t.commissionAsset,
          side: isBuyer ? 'buy' : 'sell',
          rawData: t,
        })
      }
    }

    const lastTrade = trades[trades.length - 1]
    return {
      trades,
      nextCursor: lastTrade ? { lastTradeId: lastTrade.externalId } : undefined,
    }
  }

  async fetchTransfers(
    creds: ExchangeCredentials,
    cursor?: Record<string, unknown>
  ): Promise<{ transfers: RawTransfer[], nextCursor?: Record<string, unknown> }> {
    const transfers: RawTransfer[] = []
    const startTime = (cursor?.startTime as string) ?? undefined
    const params: Record<string, string> = {}
    if (startTime) params.startTime = startTime

    // Deposits
    const depsRes = await this.signedRequest('GET', '/sapi/v1/capital/deposit/hisrec', creds, params)
    if (depsRes.ok) {
      const deps = await depsRes.json()
      for (const d of deps) {
        transfers.push({
          externalId: d.id ?? d.txId,
          timestamp: new Date(d.insertTime),
          asset: d.coin,
          amount: parseFloat(d.amount),
          type: 'deposit',
          txHash: d.txId,
          toAddress: d.address,
          rawData: d,
        })
      }
    }

    // Withdrawals
    const wdsRes = await this.signedRequest('GET', '/sapi/v1/capital/withdraw/history', creds, params)
    if (wdsRes.ok) {
      const wds = await wdsRes.json()
      for (const w of wds) {
        transfers.push({
          externalId: w.id,
          timestamp: new Date(w.applyTime),
          asset: w.coin,
          amount: parseFloat(w.amount),
          type: 'withdrawal',
          txHash: w.txId,
          toAddress: w.address,
          feeAmount: parseFloat(w.transactionFee ?? '0'),
          feeAsset: w.coin,
          rawData: w,
        })
      }
    }

    return { transfers }
  }

  async fetchBalances(creds: ExchangeCredentials): Promise<ExchangeBalance[]> {
    const res = await this.signedRequest('GET', '/api/v3/account', creds)
    if (!res.ok) throw new Error(`Binance account error: ${res.status}`)
    const data = await res.json()

    return (data.balances ?? [])
      .filter((b: { free: string; locked: string }) => parseFloat(b.free) + parseFloat(b.locked) > 0)
      .map((b: { asset: string; free: string; locked: string }) => ({
        asset: b.asset,
        available: parseFloat(b.free),
        hold: parseFloat(b.locked),
        total: parseFloat(b.free) + parseFloat(b.locked),
      }))
  }
}
