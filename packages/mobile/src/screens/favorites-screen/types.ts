import type { Collection } from '@audius/common'

export type ExtendedCollection = Collection & {
  ownerHandle: string
  ownerName: string
}
