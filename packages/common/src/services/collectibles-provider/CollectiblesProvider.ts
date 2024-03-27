import { CollectibleState } from '~/models'

export interface CollectiblesProvider {
  getCollectibles(wallets: string[]): Promise<CollectibleState>
}
