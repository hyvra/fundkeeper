import crypto from 'crypto'
import { ExchangeAdapter, ExchangeCredentials, RawTrade, RawTransfer, ExchangeBalance } from '@/types/exchange'
import { RateLimiter } from './rate-limiter'

const BASE_URL = 'https://api.coinbase.com'

export class CoinbaseAdapter implements ExchangeAdapter {
  name = 'coinbase' as const
  private limiter = new RateLimiter('coinbase')

  private async signedRequest(
    method: string,
    path: string,
    creds: ExchangeCredentials,
    body?: string
  ): Promise<Response> {
    await this.limiter.throttle()

    const timestamp = Math.floor(Date.now() / 1000).toString()
    const message = timestamp + method.toUpperCase() + path + (body ?? '')
    const signature = crypto
      .createHmac('sha256', creds.apiSecret)
      .update(message)
      .digest('hex')

    return fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'CB-ACCESS-KEY': creds.apiKey,
        'CB-ACCESS-SIGN': signature,
        'CB-ACCESS-TIMESTAMP': timestamp,
        'CB-VERSION': '2024-01-01',
        'Content-Type': 'application/json',
      },
      body: body ?? undefined,
    })
  }

  async validateCredentials(creds: ExchangeCredentials): Promise<boolean> {
    try {
      const res = await this.signedRequest('GET', '/v2/user', creds)
      return res.ok
    } catch {
      return false
    }
  }

  async fetchTrades(
    creds: ExchangeCredentials,
    cursor?: Record<string, unknown>
  ): Promise<{ trades: RawTrade[], nextCursor?: Record<string, unknown> }> {
    // First get all accounts
    const accountsRes = await this.signedRequest('GET', '/v2/accounts?limit=100', creds)
    if (!accountsRes.ok) throw new Error(`Coinbase accounts error: ${accountsRes.status}`)
    const accountsData = await accountsRes.json()

    const trades: RawTrade[] = []
    const startingAfter = (cursor?.lastTradeId as string) ?? undefined

    for (const account of accountsData.data ?? []) {
      let path = `/v2/accounts/${account.id}/buys?limit=100`
      if (startingAfter) path += `&starting_after=${startingAfter}`

      const buysRes = await this.signedRequest('GET', path, creds)
      if (buysRes.ok) {
        const buysData = await buysRes.json()
        for (const buy of buysData.data ?? []) {
          trades.push({
            externalId: buy.id,
            timestamp: new Date(buy.created_at),
            asset: buy.amount?.currency ?? 'UNKNOWN',
            amount: parseFloat(buy.amount?.amount ?? '0'),
            counterAsset: buy.total?.currency ?? 'USD',
            counterAmount: parseFloat(buy.total?.amount ?? '0'),
            feeAmount: parseFloat(buy.fee?.amount ?? '0'),
            feeAsset: buy.fee?.currency ?? 'USD',
            side: 'buy',
            rawData: buy,
          })
        }
      }

      // Sells
      let sellPath = `/v2/accounts/${account.id}/sells?limit=100`
      if (startingAfter) sellPath += `&starting_after=${startingAfter}`

      const sellsRes = await this.signedRequest('GET', sellPath, creds)
      if (sellsRes.ok) {
        const sellsData = await sellsRes.json()
        for (const sell of sellsData.data ?? []) {
          trades.push({
            externalId: sell.id,
            timestamp: new Date(sell.created_at),
            asset: sell.amount?.currency ?? 'UNKNOWN',
            amount: parseFloat(sell.amount?.amount ?? '0'),
            counterAsset: sell.total?.currency ?? 'USD',
            counterAmount: parseFloat(sell.total?.amount ?? '0'),
            feeAmount: parseFloat(sell.fee?.amount ?? '0'),
            feeAsset: sell.fee?.currency ?? 'USD',
            side: 'sell',
            rawData: sell,
          })
        }
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
    const accountsRes = await this.signedRequest('GET', '/v2/accounts?limit=100', creds)
    if (!accountsRes.ok) throw new Error(`Coinbase accounts error: ${accountsRes.status}`)
    const accountsData = await accountsRes.json()

    const transfers: RawTransfer[] = []
    const startingAfter = (cursor?.lastTransferId as string) ?? undefined

    for (const account of accountsData.data ?? []) {
      // Deposits
      let depPath = `/v2/accounts/${account.id}/deposits?limit=100`
      if (startingAfter) depPath += `&starting_after=${startingAfter}`

      const depsRes = await this.signedRequest('GET', depPath, creds)
      if (depsRes.ok) {
        const depsData = await depsRes.json()
        for (const dep of depsData.data ?? []) {
          transfers.push({
            externalId: dep.id,
            timestamp: new Date(dep.created_at),
            asset: dep.amount?.currency ?? 'UNKNOWN',
            amount: parseFloat(dep.amount?.amount ?? '0'),
            type: 'deposit',
            feeAmount: dep.fee ? parseFloat(dep.fee.amount) : undefined,
            feeAsset: dep.fee?.currency,
            rawData: dep,
          })
        }
      }

      // Withdrawals
      let wdPath = `/v2/accounts/${account.id}/withdrawals?limit=100`
      if (startingAfter) wdPath += `&starting_after=${startingAfter}`

      const wdsRes = await this.signedRequest('GET', wdPath, creds)
      if (wdsRes.ok) {
        const wdsData = await wdsRes.json()
        for (const wd of wdsData.data ?? []) {
          transfers.push({
            externalId: wd.id,
            timestamp: new Date(wd.created_at),
            asset: wd.amount?.currency ?? 'UNKNOWN',
            amount: parseFloat(wd.amount?.amount ?? '0'),
            type: 'withdrawal',
            feeAmount: wd.fee ? parseFloat(wd.fee.amount) : undefined,
            feeAsset: wd.fee?.currency,
            rawData: wd,
          })
        }
      }
    }

    const lastTransfer = transfers[transfers.length - 1]
    return {
      transfers,
      nextCursor: lastTransfer ? { lastTransferId: lastTransfer.externalId } : undefined,
    }
  }

  async fetchBalances(creds: ExchangeCredentials): Promise<ExchangeBalance[]> {
    const res = await this.signedRequest('GET', '/v2/accounts?limit=100', creds)
    if (!res.ok) throw new Error(`Coinbase balances error: ${res.status}`)
    const data = await res.json()

    return (data.data ?? [])
      .filter((a: { balance?: { amount?: string } }) => parseFloat(a.balance?.amount ?? '0') > 0)
      .map((a: { currency?: { code?: string }; balance?: { amount?: string } }) => ({
        asset: a.currency?.code ?? 'UNKNOWN',
        available: parseFloat(a.balance?.amount ?? '0'),
        hold: 0,
        total: parseFloat(a.balance?.amount ?? '0'),
      }))
  }
}
