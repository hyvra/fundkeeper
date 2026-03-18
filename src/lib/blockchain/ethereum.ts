import { ChainAdapter, ChainTransaction, ChainBalance } from '@/types/blockchain'

// Blockscout: free, no API key required, Etherscan-compatible response format
const BLOCKSCOUT_API = 'https://eth.blockscout.com/api'

// Free public Ethereum RPC for balance queries
const ETH_RPC = 'https://eth.drpc.org'

export class EthereumAdapter implements ChainAdapter {
  chain = 'ethereum' as const

  async fetchTransactions(
    address: string,
    cursor?: Record<string, unknown>
  ): Promise<{ transactions: ChainTransaction[], nextCursor?: Record<string, unknown> }> {
    const page = (cursor?.page as number) ?? 1
    const params = new URLSearchParams({
      module: 'account',
      action: 'txlist',
      address,
      startblock: '0',
      endblock: '99999999',
      page: String(page),
      offset: '100',
      sort: 'desc',
    })

    const res = await fetch(`${BLOCKSCOUT_API}?${params}`)
    if (!res.ok) throw new Error(`Blockscout API returned ${res.status}`)
    const data = await res.json()

    if (data.message === 'No transactions found') {
      return { transactions: [] }
    }

    if (data.message !== 'OK' || !Array.isArray(data.result)) {
      throw new Error(`Blockscout error: ${data.message ?? data.result ?? 'Unknown error'}`)
    }

    if (data.result.length === 0) {
      return { transactions: [] }
    }

    const transactions: ChainTransaction[] = data.result.map((tx: Record<string, string>) => {
      const isIncoming = tx.to?.toLowerCase() === address.toLowerCase()
      return {
        txHash: tx.hash,
        timestamp: new Date(Number(tx.timeStamp) * 1000),
        asset: 'ETH',
        amount: Number(tx.value) / 1e18,
        fromAddress: tx.from,
        toAddress: tx.to,
        fee: (Number(tx.gasUsed) * Number(tx.gasPrice)) / 1e18,
        feeAsset: 'ETH',
        type: isIncoming ? 'incoming' : 'outgoing',
        rawData: tx,
      }
    })

    return {
      transactions,
      nextCursor: transactions.length >= 100 ? { page: page + 1 } : undefined,
    }
  }

  async fetchBalance(address: string): Promise<ChainBalance[]> {
    const res = await fetch(ETH_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBalance',
        params: [address, 'latest'],
      }),
    })
    if (!res.ok) throw new Error(`ETH RPC error: ${res.status}`)
    const data = await res.json()
    if (data.error) throw new Error(`ETH RPC: ${data.error.message}`)

    return [{
      asset: 'ETH',
      balance: parseInt(data.result, 16) / 1e18,
    }]
  }
}
