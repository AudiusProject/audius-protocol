import { Collectible } from '@audius/common'

export type CollectibleState = {
  [wallet: string]: Collectible[]
}
