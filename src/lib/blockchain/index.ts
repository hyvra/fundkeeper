import { ChainAdapter, ChainName } from '@/types/blockchain'
import { EthereumAdapter } from './ethereum'
import { BitcoinAdapter } from './bitcoin'
import { SolanaAdapter } from './solana'

const adapters: Record<ChainName, () => ChainAdapter> = {
  ethereum: () => new EthereumAdapter(),
  bitcoin: () => new BitcoinAdapter(),
  solana: () => new SolanaAdapter(),
}

export function getChainAdapter(chain: ChainName): ChainAdapter {
  return adapters[chain]()
}
