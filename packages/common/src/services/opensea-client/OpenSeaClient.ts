import { allSettled } from '~/utils/allSettled'

import {
  Collectible,
  CollectibleState,
  OpenSeaAsset,
  OpenSeaAssetExtended,
  OpenSeaEvent,
  OpenSeaEventExtended
} from '../../models'

import {
  isAssetValid,
  assetToCollectible,
  creationEventToCollectible,
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
  ): Promise<{ asset_events: OpenSeaEvent[] }> {
    return fetch(
      `${this.url}/events?account_address=${wallet}&limit=${limit}&event_type=transfer&only_opensea=false`
    ).then((r) => r.json())
  }

  async getTransferredCollectiblesForMultipleWallets(
    wallets: string[],
    limit = OPENSEA_NUM_ASSETS_LIMIT
  ): Promise<OpenSeaEventExtended[]> {
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
            (
              result as PromiseFulfilledResult<{
                asset_events: OpenSeaEvent[]
              }>
            ).value.asset_events?.map((event) => ({
              ...event,
              asset: { ...event.asset, wallet },
              wallet
            })) || []
        )
        .flat()
    )
  }

  async getCreatedCollectiblesForWallet(
    wallet: string,
    limit = OPENSEA_NUM_ASSETS_LIMIT
  ): Promise<{ asset_events: OpenSeaEvent[] }> {
    return fetch(
      `${this.url}/events?account_address=${wallet}&limit=${limit}&event_type=created&only_opensea=false`
    ).then((r) => r.json())
  }

  async getCreatedCollectiblesForMultipleWallets(
    wallets: string[],
    limit = OPENSEA_NUM_ASSETS_LIMIT
  ): Promise<OpenSeaEventExtended[]> {
    return allSettled(
      wallets.map((wallet) =>
        this.getCreatedCollectiblesForWallet(wallet, limit)
      )
    ).then((results) =>
      results
        .map((result, i) => ({ result, wallet: wallets[i] }))
        .filter(({ result }) => result.status === 'fulfilled')
        .map(
          ({ result, wallet }) =>
            (
              result as PromiseFulfilledResult<{
                asset_events: OpenSeaEvent[]
              }>
            ).value.asset_events?.map((event) => ({
              ...event,
              asset: { ...event.asset, wallet },
              wallet
            })) || []
        )
        .flat()
    )
  }

  async getCollectiblesForWallet(
    wallet: string,
    limit = OPENSEA_NUM_ASSETS_LIMIT
  ): Promise<{ assets: OpenSeaAsset[] }> {
    return fetch(`${this.url}/assets?owner=${wallet}&limit=${limit}`).then(
      (r) => r.json()
    )
  }

  async getCollectiblesForMultipleWallets(
    wallets: string[],
    limit = OPENSEA_NUM_ASSETS_LIMIT
  ): Promise<OpenSeaAssetExtended[]> {
    return allSettled(
      wallets.map((wallet) => this.getCollectiblesForWallet(wallet, limit))
    ).then((results) =>
      results
        .map((result, i) => ({ result, wallet: wallets[i] }))
        .filter(({ result }) => result.status === 'fulfilled')
        .map(
          ({ result, wallet }) =>
            (
              result as PromiseFulfilledResult<{
                assets: OpenSeaAsset[]
              }>
            ).value.assets?.map((asset) => ({ ...asset, wallet })) || []
        )
        .flat()
    )
  }

  async getAllCollectibles(wallets: string[]): Promise<CollectibleState> {
    const lowercasedWallets = wallets.map((wallet) => wallet.toLowerCase())

    return Promise.all([
      this.getCollectiblesForMultipleWallets(wallets),
      this.getCreatedCollectiblesForMultipleWallets(wallets),
      this.getTransferredCollectiblesForMultipleWallets(wallets)
    ]).then(async ([assets, creationEvents, transferEvents]) => {
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

      // Handle transfers from NullAddress as if they were created events
      const firstOwnershipTransferEvents = transferEvents
        .filter(
          (event) =>
            event?.asset &&
            isAssetValid(event.asset) &&
            !isNotFromNullAddress(event)
        )
        .reduce((acc: { [key: string]: OpenSeaEventExtended }, curr) => {
          const { token_id, asset_contract } = curr.asset
          const id = `${token_id}:::${asset_contract?.address ?? ''}`
          if (
            acc[id] &&
            acc[id].created_date.localeCompare(curr.created_date) > 0
          ) {
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
              dateLastTransferred: event.created_date
            }
          } else {
            ownedCollectibleKeySet.add(id)
            collectiblesMap[id] = await transferEventToCollectible(event, false)
          }
          return event
        })
      )

      // Handle created events
      await Promise.all(
        creationEvents
          .filter((event) => event?.asset && isAssetValid(event.asset))
          .map(async (event) => {
            const { token_id, asset_contract } = event.asset
            const id = `${token_id}:::${asset_contract?.address ?? ''}`
            if (!ownedCollectibleKeySet.has(id)) {
              collectiblesMap[id] = await creationEventToCollectible(event)
              ownedCollectibleKeySet.add(id)
            }
            return event
          })
      )

      // Handle transfers
      const latestTransferEventsMap = transferEvents
        .filter(
          (event) =>
            event?.asset &&
            isAssetValid(event.asset) &&
            isNotFromNullAddress(event)
        )
        .reduce((acc: { [key: string]: OpenSeaEventExtended }, curr) => {
          const { token_id, asset_contract } = curr.asset
          const id = `${token_id}:::${asset_contract?.address ?? ''}`
          if (
            acc[id] &&
            acc[id].created_date.localeCompare(curr.created_date) > 0
          ) {
            return acc
          }
          return { ...acc, [id]: curr }
        }, {})
      await Promise.all(
        Object.values(latestTransferEventsMap).map(async (event) => {
          const { token_id, asset_contract } = event.asset
          const id = `${token_id}:::${asset_contract?.address ?? ''}`
          if (ownedCollectibleKeySet.has(id)) {
            // Remove collectible if it was transferred out from
            // one of the user's wallets.
            if (
              lowercasedWallets.includes(
                event.from_account.address.toLowerCase()
              )
            ) {
              ownedCollectibleKeySet.delete(id)
              delete collectiblesMap[id]
            } else {
              collectiblesMap[id] = {
                ...collectiblesMap[id],
                dateLastTransferred: event.created_date
              }
            }
          } else if (
            lowercasedWallets.includes(event.to_account.address.toLowerCase())
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
