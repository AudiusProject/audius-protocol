import dayjs from 'dayjs'

import { Collectible, CollectibleState } from '~/models'
import { allSettled } from '~/utils'

import { OpenSeaClient } from '../opensea'
import {
  OpenSeaCollection,
  OpenSeaEvent,
  OpenSeaEventExtended,
  OpenSeaNft,
  OpenSeaNftExtended,
  OpenSeaNftMetadata
} from '../opensea/types'

import { CollectiblesProvider } from './CollectiblesProvider'
import {
  assetToCollectible,
  getAssetIdentifier,
  isAssetValid,
  isNotFromNullAddress,
  transferEventToCollectible
} from './ethCollectibleHelpers'

export class EthereumCollectiblesProvider implements CollectiblesProvider {
  private readonly openSeaClient: OpenSeaClient

  constructor(openSeaClient: OpenSeaClient) {
    this.openSeaClient = openSeaClient
  }

  async getNftsForMultipleWallets(wallets: string[]): Promise<OpenSeaNft[]> {
    return allSettled(
      wallets.map((wallet) => this.openSeaClient.getNftsForWallet(wallet))
    ).then((results) =>
      results
        .map((result, i) => ({ result, wallet: wallets[i] }))
        .filter(({ result }) => result.status === 'fulfilled')
        .map(
          ({ result, wallet }) =>
            (result as PromiseFulfilledResult<OpenSeaNft[]>).value?.map(
              (nft) => ({ ...nft, wallet })
            ) || []
        )
        .flat()
    )
  }

  async getNftTransferEventsForMultipleWallets(
    wallets: string[]
  ): Promise<OpenSeaEvent[]> {
    return allSettled(
      wallets.map((wallet) =>
        this.openSeaClient.getNftTransferEventsForWallet(wallet)
      )
    ).then((results) =>
      results
        .map((result, i) => ({ result, wallet: wallets[i] }))
        .filter(({ result }) => result.status === 'fulfilled')
        .map(
          ({ result, wallet }) =>
            (result as PromiseFulfilledResult<OpenSeaEvent[]>).value?.map(
              (event) => ({
                ...event,
                nft: { ...event.nft, wallet },
                wallet
              })
            ) || []
        )
        .flat()
    )
  }

  async addNftMetadata(nft: OpenSeaNft): Promise<OpenSeaNftExtended> {
    let metadata: OpenSeaNftMetadata | undefined
    try {
      const res = await fetch(nft.metadata_url)
      metadata = await res.json()
    } catch (e) {
      console.error(e)
      metadata = undefined
    }
    return { ...nft, ...(metadata ?? {}) }
  }

  async getCollectionMetadatas(
    addresses: string[]
  ): Promise<{ [address: string]: OpenSeaCollection }> {
    const collections = await Promise.all(
      addresses.map((address) => {
        try {
          return this.openSeaClient.getCollectionMetadata(address)
        } catch (e) {
          return null
        }
      })
    )
    return collections.reduce((acc, curr, i) => {
      acc[addresses[i]] = curr
      return acc
    }, {})
  }

  async getCollectibles(wallets: string[]): Promise<CollectibleState> {
    return Promise.all([
      this.getNftsForMultipleWallets(wallets),
      this.getNftTransferEventsForMultipleWallets(wallets)
    ]).then(async ([nfts, transferEvents]) => {
      const assets = await Promise.all(
        nfts.map(async (nft) => this.addNftMetadata(nft))
      )
      const validAssets = assets.filter((asset) => asset && isAssetValid(asset))

      // For assets, build a set of collections to fetch metadata for
      // and fetch them all at once, making sure to not fetch
      // the same collection metadata multiple times.
      const assetCollectionSet = new Set<string>()
      const idToAssetCollectionMap = validAssets.reduce((acc, curr) => {
        // Believe it or not, sometimes, rarely, the type of collection is an object
        // that looks like { name: string, family: string }
        // and sometimes it's a string. I don't know why.
        // Wonder if worth changing the 'collection' type and chasing down all the
        // type errors that would cause just for this irregularity. Probably not for now.
        const collection =
          typeof curr.collection === 'object'
            ? (curr.collection as unknown as any).name ?? ''
            : curr.collection
        assetCollectionSet.add(collection)
        const id = getAssetIdentifier(curr)
        acc[id] = collection
        return acc
      }, {})
      const assetCollectionMetadatasMap = await this.getCollectionMetadatas(
        Array.from(assetCollectionSet)
      )
      validAssets.forEach((asset) => {
        const id = getAssetIdentifier(asset)
        const collection = idToAssetCollectionMap[id]
        const collectionMetadata = assetCollectionMetadatasMap[collection]
        if (collectionMetadata) {
          asset.collectionMetadata = collectionMetadata
        }
      })

      const collectibles = await Promise.all(
        validAssets.map(async (asset) => await assetToCollectible(asset))
      )
      const collectiblesMap: {
        [key: string]: Collectible
      } = collectibles.reduce((acc, curr) => {
        acc[curr.id] = curr
        return acc
      }, {})

      const ownedCollectibleKeySet = new Set(Object.keys(collectiblesMap))
      const lowercasedWallets = wallets.map((wallet) => wallet.toLowerCase())

      const transferEventsExtended: OpenSeaEventExtended[] = await Promise.all(
        transferEvents.map(async (event) => {
          const nftMetadata = await this.addNftMetadata(event.nft)
          return { ...event, nft: nftMetadata }
        })
      )

      // For events, build a set of collections to fetch metadata for
      // and fetch them all at once, making sure to not fetch
      // the same collection metadata multiple times.
      const eventCollectionSet = new Set<string>()
      const idToEventCollectionMap = transferEventsExtended.reduce(
        (acc, curr) => {
          // Believe it or not, sometimes, rarely, the type of collection is an object
          // that looks like { name: string, family: string }
          // and sometimes it's a string. I don't know why.
          // Wonder if worth changing the 'collection' type and chasing down all the
          // type errors that would cause just for this irregularity. Probably not for now.
          const collection =
            typeof curr.nft.collection === 'object'
              ? (curr.nft.collection as unknown as any).name ?? ''
              : curr.nft.collection
          if (!assetCollectionMetadatasMap[collection]) {
            eventCollectionSet.add(collection)
            const id = getAssetIdentifier(curr.nft)
            acc[id] = collection
          }
          return acc
        },
        {}
      )
      const eventCollectionMetadatasMap = await this.getCollectionMetadatas(
        Array.from(eventCollectionSet)
      )
      transferEventsExtended.forEach((event) => {
        const id = getAssetIdentifier(event.nft)
        const collection = idToEventCollectionMap[id]
        const collectionMetadata = eventCollectionMetadatasMap[collection]
        if (collectionMetadata) {
          event.nft.collectionMetadata = collectionMetadata
        }
      })

      // Handle transfers from NullAddress as they were created events
      const firstOwnershipTransferEvents = transferEventsExtended
        .filter(
          (event) =>
            event?.nft &&
            isAssetValid(event.nft) &&
            !isNotFromNullAddress(event)
        )
        .reduce((acc: { [key: string]: OpenSeaEventExtended }, curr) => {
          const id = getAssetIdentifier(curr.nft)
          if (acc[id] && acc[id].event_timestamp - curr.event_timestamp > 0) {
            return acc
          }
          acc[id] = curr
          return acc
        }, {})
      await Promise.all(
        Object.entries(firstOwnershipTransferEvents).map(async (entry) => {
          const [id, event] = entry
          if (ownedCollectibleKeySet.has(id)) {
            collectiblesMap[id] = {
              ...collectiblesMap[id],
              dateLastTransferred: dayjs(event.event_timestamp).toString()
            }
          } else {
            ownedCollectibleKeySet.add(id)
            collectiblesMap[id] = await transferEventToCollectible(event, false)
          }
          return event
        })
      )

      // Handle transfers
      const latestTransferEventsMap = transferEvents
        .filter(
          (event) =>
            event?.nft && isAssetValid(event.nft) && isNotFromNullAddress(event)
        )
        .reduce((acc: { [key: string]: OpenSeaEventExtended }, curr) => {
          const id = getAssetIdentifier(curr.nft)
          if (acc[id] && acc[id].event_timestamp - curr.event_timestamp > 0) {
            return acc
          }
          acc[id] = curr
          return acc
        }, {})
      await Promise.all(
        Object.values(latestTransferEventsMap).map(async (event) => {
          const id = getAssetIdentifier(event.nft)
          if (ownedCollectibleKeySet.has(id)) {
            // Remove collectible if it was transferred out from
            // one of the user's wallets.
            if (lowercasedWallets.includes(event.from_address.toLowerCase())) {
              ownedCollectibleKeySet.delete(id)
              delete collectiblesMap[id]
            } else {
              collectiblesMap[id] = {
                ...collectiblesMap[id],
                dateLastTransferred: dayjs(event.event_timestamp).toString()
              }
            }
          } else if (
            lowercasedWallets.includes(event.to_address.toLowerCase())
          ) {
            ownedCollectibleKeySet.add(id)
            collectiblesMap[id] = await transferEventToCollectible(event)
          }
          return event
        })
      )

      const result = Object.values(collectiblesMap).reduce(
        (result, collectible) => {
          result[collectible.wallet] = (
            result[collectible.wallet] || []
          ).concat([collectible])
          return result
        },
        {}
      )
      return result
    })
  }
}
