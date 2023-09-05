import { Collectible } from './Collectible'

export type CollectibleState = {
  [wallet: string]: Collectible[]
}
