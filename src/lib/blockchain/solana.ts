import { ChainAdapter, ChainTransaction, ChainBalance } from '@/types/blockchain'

const SOLANA_RPC = 'https://api.mainnet-beta.solana.com'

export class SolanaAdapter implements ChainAdapter {
  chain = 'solana' as const

  private async rpcCall(method: string, params: unknown[]): Promise<unknown> {
    const res = await fetch(SOLANA_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    })
    if (!res.ok) throw new Error(`Solana RPC error: ${res.status}`)
    const data = await res.json()
    if (data.error) throw new Error(`Solana RPC: ${data.error.message}`)
    return data.result
  }

  async fetchTransactions(
    address: string,
    cursor?: Record<string, unknown>
  ): Promise<{ transactions: ChainTransaction[], nextCursor?: Record<string, unknown> }> {
    const opts: Record<string, unknown> = { limit: 100 }
    if (cursor?.before) opts.before = cursor.before

    // Get transaction signatures
    const sigs = await this.rpcCall('getSignaturesForAddress', [address, opts]) as Array<{
      signature: string
      blockTime: number | null
      err: unknown | null
    }>

    if (!sigs?.length) return { transactions: [] }

    // Fetch transaction details (batch of first 20 to avoid rate limits)
    const transactions: ChainTransaction[] = []
    const batch = sigs.slice(0, 20)

    for (const sig of batch) {
      try {
        const tx = await this.rpcCall('getTransaction', [sig.signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }]) as Record<string, unknown> | null
        if (!tx) continue

        const meta = tx.meta as Record<string, unknown> | null
        if (!meta) continue

        const preBalances = (meta.preBalances as number[]) ?? []
        const postBalances = (meta.postBalances as number[]) ?? []

        // Simple heuristic: look at balance change for this address
        const accountKeys = ((tx.transaction as Record<string, unknown>)?.message as Record<string, unknown>)?.accountKeys as Array<{ pubkey: string }> ?? []
        const addrIndex = accountKeys.findIndex(k => (typeof k === 'string' ? k : k.pubkey) === address)

        if (addrIndex === -1) continue

        const balanceChange = ((postBalances[addrIndex] ?? 0) - (preBalances[addrIndex] ?? 0)) / 1e9
        const fee = Number(meta.fee ?? 0) / 1e9

        transactions.push({
          txHash: sig.signature,
          timestamp: new Date((sig.blockTime ?? Math.floor(Date.now() / 1000)) * 1000),
          asset: 'SOL',
          amount: Math.abs(balanceChange),
          fromAddress: balanceChange < 0 ? address : '',
          toAddress: balanceChange > 0 ? address : '',
          fee,
          feeAsset: 'SOL',
          type: balanceChange > 0 ? 'incoming' : 'outgoing',
          rawData: { signature: sig.signature, blockTime: sig.blockTime },
        })
      } catch {
        // Skip failed transaction lookups
        continue
      }
    }

    const lastSig = sigs[sigs.length - 1]
    return {
      transactions,
      nextCursor: sigs.length >= 100 ? { before: lastSig?.signature } : undefined,
    }
  }

  async fetchBalance(address: string): Promise<ChainBalance[]> {
    const result = await this.rpcCall('getBalance', [address]) as { value: number }
    return [{
      asset: 'SOL',
      balance: (result?.value ?? 0) / 1e9,
    }]
  }
}
