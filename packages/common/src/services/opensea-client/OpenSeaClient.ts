import dayjs from 'dayjs'

import { allSettled } from 'utils/allSettled'

import {
  Collectible,
  CollectibleState,
  OpenSeaNftMetadata,
  OpenSeaNftExtended,
  OpenSeaEvent,
  OpenSeaEventExtended,
  OpenSeaNft,
  OpenSeaCollection
} from '../../models'

import {
  isAssetValid,
  assetToCollectible,
  transferEventToCollectible,
  isNotFromNullAddress
} from './ethCollectibleHelpers'

const OPENSEA_NUM_ASSETS_LIMIT = 1000

export class OpenSeaClient {
  readonly url: string
  constructor(url: string) {
    this.url = url
  }

  async getTransferredCollectiblesForWallet(
    wallet: string,
    limit = OPENSEA_NUM_ASSETS_LIMIT
  ): Promise<OpenSeaEvent[]> {
    let res: Response
    let json: { next: string | undefined; asset_events: OpenSeaEvent[] }
    let events: OpenSeaEvent[]
    let next: string | undefined
    res = await fetch(
      `${this.url}/api/v2/events?account=${wallet}&limit=${limit}&event_type=transfer&chain=ethereum`
    )
    json = await res.json()
    next = json.next
    events = json.asset_events
    while (next) {
      res = await fetch(
        `${this.url}/api/v2/events?account=${wallet}&limit=${limit}&event_type=transfer&chain=ethereum`
      )
      json = await res.json()
      next = json.next
      events = [...events, ...json.asset_events]
    }
    return events.map((event) => ({ ...event, wallet }))
  }

  async getTransferredCollectiblesForMultipleWallets(
    wallets: string[],
    limit = OPENSEA_NUM_ASSETS_LIMIT
  ): Promise<OpenSeaEvent[]> {
    return allSettled(
      wallets.map((wallet) =>
        this.getTransferredCollectiblesForWallet(wallet, limit)
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

  async getCollectiblesForWallet(wallet: string): Promise<OpenSeaNft[]> {
    let res: Response
    let json: { next: string | undefined; nfts: OpenSeaNft[] }
    let nfts: OpenSeaNft[]
    let next: string | undefined
    res = await fetch(
      `${this.url}/api/v2/chain/ethereum/account/${wallet}/nfts`
    )
    json = await res.json()
    next = json.next
    nfts = json.nfts
    while (next) {
      res = await fetch(
        `${this.url}/api/v2/chain/ethereum/account/${wallet}/nfts`
      )
      json = await res.json()
      next = json.next
      nfts = [...nfts, ...json.nfts]
    }
    return nfts.map((nft) => ({ ...nft, wallet }))
  }

  async getCollectiblesForMultipleWallets(
    wallets: string[]
  ): Promise<OpenSeaNft[]> {
    return allSettled(
      wallets.map((wallet) => this.getCollectiblesForWallet(wallet))
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

  async addNftMetadata(nft: OpenSeaNft): Promise<OpenSeaNftExtended> {
    let metadata: OpenSeaNftMetadata | undefined
    try {
      const res = await fetch(nft.metadata_url)
      metadata = await res.json()
    } catch (e) {
      console.error(e)
      metadata = undefined
    }

    let collectionMetadata: OpenSeaCollection | undefined
    try {
      const res = await fetch(
        `${this.url}/api/v2/collections/${nft.collection}`
      )
      collectionMetadata = await res.json()
    } catch (e) {
      console.error(e)
      collectionMetadata = undefined
    }

    return { ...nft, ...(metadata ?? {}), collectionMetadata }
  }

  async getAllCollectibles(wallets: string[]): Promise<CollectibleState> {
    return Promise.all([
      this.getCollectiblesForMultipleWallets(wallets),
      this.getTransferredCollectiblesForMultipleWallets(wallets)
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
        (acc, curr) => ({
          ...acc,
          [curr.id]: curr
        }),
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
      // Handle transfers from NullAddress as transferEventsExtended they were created events
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
          return { ...acc, [id]: curr }
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
          return { ...acc, [id]: curr }
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
        (result, collectible) => ({
          ...result,
          [collectible.wallet]: (result[collectible.wallet] || []).concat([
            collectible
          ])
        }),
        {} as CollectibleState
      )
    })
  }
}
