import { Collectible } from 'common/models/Collectible'

export type CollectibleState = {
  [wallet: string]: Collectible[]
}
