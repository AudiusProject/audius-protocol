import dayjs from 'dayjs'
import { Collectible, CollectibleState, OpenSeaEvent, OpenSeaEventExtended, OpenSeaNft, OpenSeaNftExtended, OpenSeaNftMetadata } from '~/models'
import { CollectiblesProvider } from './CollectiblesProvider'
import { OpenSeaClient, assetToCollectible, isAssetValid, isNotFromNullAddress, transferEventToCollectible } from '../opensea-client'
import { allSettled } from '~/utils'

export class EthereumCollectiblesProvider implements CollectiblesProvider {
  private readonly openSeaClient: OpenSeaClient

  constructor(openSeaClient: OpenSeaClient) {
    this.openSeaClient = openSeaClient
  }

  async getNftsForMultipleWallets(
    wallets: string[]
  ): Promise<OpenSeaNft[]> {
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

  async getNftTransferEventsForMultipleWallets(wallets: string[]): Promise<OpenSeaEvent[]> {
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

    const collectionMetadata = await this.openSeaClient.getCollectionMetadata(nft.collection)
    if (collectionMetadata === null) {
      return { ...nft, ...(metadata ?? {}) }
    }
    return { ...nft, ...(metadata ?? {}), collectionMetadata }
  }

  async getCollectibles(wallets: string[]): Promise<CollectibleState> {
    return Promise.all([
      this.getNftsForMultipleWallets(wallets),
      this.getNftTransferEventsForMultipleWallets(wallets)
    ]).then(async ([nfts, transferEvents]) => {
      const assets = await Promise.all(
        nfts.map(async (nft) => this.addNftMetadata(nft))
      )
      const filteredAssets = assets.filter(
        (asset) => asset && isAssetValid(asset)
      )
      const collectibles = await Promise.all(
        filteredAssets.map(async (asset) => await assetToCollectible(asset))
      )
      const collectiblesMap: {
        [key: string]: Collectible
      } = collectibles.reduce(
        (acc, curr) => {
          acc[curr.id] = curr
          return acc
        },
        {}
      )
      
      const ownedCollectibleKeySet = new Set(Object.keys(collectiblesMap))
      const lowercasedWallets = wallets.map((wallet) => wallet.toLowerCase())

      const transferEventsExtended: OpenSeaEventExtended[] = await Promise.all(
        transferEvents.map(async (event) => {
          const nftMetadata = await this.addNftMetadata(event.nft)
          return { ...event, nft: nftMetadata }
        })
      )

      // Handle transfers from NullAddress as they were created events
      const firstOwnershipTransferEvents = transferEventsExtended
        .filter(
          (event) =>
            event?.nft &&
            isAssetValid(event.nft) &&
            !isNotFromNullAddress(event)
        )
        .reduce((acc: { [key: string]: OpenSeaEventExtended }, curr) => {
          const { identifier, contract } = curr.nft
          const id = `${identifier}:::${contract || ''}`
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
          const { identifier, contract } = curr.nft
          const id = `${identifier}:::${contract || ''}`
          if (acc[id] && acc[id].event_timestamp - curr.event_timestamp > 0) {
            return acc
          }
          acc[id] = curr
          return acc
        }, {})
      await Promise.all(
        Object.values(latestTransferEventsMap).map(async (event) => {
          const { identifier, contract } = event.nft
          const id = `${identifier}:::${contract || ''}`
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

      return Object.values(collectiblesMap).reduce(
        (result, collectible) => {
          result[collectible.wallet] = (result[collectible.wallet] || []).concat([
            collectible
          ])
          return result
        },
        {} as CollectibleState
      )
    })
  }
}
