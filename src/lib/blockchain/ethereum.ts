import { ChainAdapter, ChainTransaction, ChainBalance } from '@/types/blockchain'

const ETHERSCAN_API = 'https://api.etherscan.io/api'

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

    const res = await fetch(`${ETHERSCAN_API}?${params}`)
    if (!res.ok) throw new Error(`Etherscan error: ${res.status}`)
    const data = await res.json()

    if (data.status !== '1' || !data.result?.length) {
      return { transactions: [] }
    }

    const transactions: ChainTransaction[] = data.result.map((tx: Record<string, string>) => {
      const isIncoming = tx.to.toLowerCase() === address.toLowerCase()
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
    const params = new URLSearchParams({
      module: 'account',
      action: 'balance',
      address,
      tag: 'latest',
    })

    const res = await fetch(`${ETHERSCAN_API}?${params}`)
    if (!res.ok) throw new Error(`Etherscan balance error: ${res.status}`)
    const data = await res.json()

    return [{
      asset: 'ETH',
      balance: Number(data.result) / 1e18,
    }]
  }
}
