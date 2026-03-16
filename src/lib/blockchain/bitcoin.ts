import { ChainAdapter, ChainTransaction, ChainBalance } from '@/types/blockchain'

const BLOCKSTREAM_API = 'https://blockstream.info/api'

export class BitcoinAdapter implements ChainAdapter {
  chain = 'bitcoin' as const

  async fetchTransactions(
    address: string,
    cursor?: Record<string, unknown>
  ): Promise<{ transactions: ChainTransaction[], nextCursor?: Record<string, unknown> }> {
    let url = `${BLOCKSTREAM_API}/address/${address}/txs`
    if (cursor?.lastTxid) url += `/chain/${cursor.lastTxid}`

    const res = await fetch(url)
    if (!res.ok) throw new Error(`Blockstream error: ${res.status}`)
    const txs = await res.json()

    const transactions: ChainTransaction[] = txs.map((tx: Record<string, unknown>) => {
      const vout = (tx.vout as Array<{ scriptpubkey_address?: string; value?: number }>) ?? []
      const vin = (tx.vin as Array<{ prevout?: { scriptpubkey_address?: string; value?: number } }>) ?? []

      // Determine if incoming or outgoing
      const isIncoming = vout.some(o => o.scriptpubkey_address === address)
      const isOutgoing = vin.some(i => i.prevout?.scriptpubkey_address === address)

      // Calculate amount
      let amount = 0
      if (isIncoming && !isOutgoing) {
        amount = vout.filter(o => o.scriptpubkey_address === address).reduce((s, o) => s + (o.value ?? 0), 0)
      } else if (isOutgoing) {
        const sent = vin.filter(i => i.prevout?.scriptpubkey_address === address).reduce((s, i) => s + (i.prevout?.value ?? 0), 0)
        const received = vout.filter(o => o.scriptpubkey_address === address).reduce((s, o) => s + (o.value ?? 0), 0)
        amount = sent - received
      }

      return {
        txHash: String(tx.txid),
        timestamp: new Date(((tx.status as Record<string, number>)?.block_time ?? Date.now() / 1000) * 1000),
        asset: 'BTC',
        amount: amount / 1e8, // satoshis to BTC
        fromAddress: vin[0]?.prevout?.scriptpubkey_address ?? '',
        toAddress: vout[0]?.scriptpubkey_address ?? '',
        fee: Number(tx.fee ?? 0) / 1e8,
        feeAsset: 'BTC',
        type: (isIncoming && !isOutgoing) ? 'incoming' as const : 'outgoing' as const,
        rawData: tx as Record<string, unknown>,
      }
    })

    const lastTx = txs[txs.length - 1]
    return {
      transactions,
      nextCursor: txs.length >= 25 ? { lastTxid: lastTx?.txid } : undefined,
    }
  }

  async fetchBalance(address: string): Promise<ChainBalance[]> {
    const res = await fetch(`${BLOCKSTREAM_API}/address/${address}`)
    if (!res.ok) throw new Error(`Blockstream balance error: ${res.status}`)
    const data = await res.json()

    const funded = data.chain_stats?.funded_txo_sum ?? 0
    const spent = data.chain_stats?.spent_txo_sum ?? 0

    return [{
      asset: 'BTC',
      balance: (funded - spent) / 1e8,
    }]
  }
}
