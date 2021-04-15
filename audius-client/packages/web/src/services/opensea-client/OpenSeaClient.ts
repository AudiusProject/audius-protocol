import { OpenSeaAsset, OpenSeaEvent } from 'services/opensea-client/types'
import {
  isAssetValid,
  assetToCollectible,
  creationEventToCollectible,
  transferEventToCollectible,
  isNotFromNullAddress
} from 'containers/collectibles/helpers'
import { Collectible } from 'containers/collectibles/components/types'

const OPENSEA_API_URL = process.env.REACT_APP_OPENSEA_API_URL
const OPENSEA_NUM_ASSETS_LIMIT = 1000

class OpenSeaClient {
  readonly url = OPENSEA_API_URL

  async getTransferredCollectiblesForWallet(
    wallet: string,
    limit = OPENSEA_NUM_ASSETS_LIMIT
  ): Promise<{ asset_events: OpenSeaEvent[] }> {
    return fetch(
      `${client.url}/events?account_address=${wallet}&limit=${limit}&event_type=transfer&only_opensea=false`
    ).then(r => r.json())
  }

  async getTransferredCollectiblesForMultipleWallets(
    wallets: string[],
    limit = OPENSEA_NUM_ASSETS_LIMIT
  ): Promise<OpenSeaEvent[]> {
    return Promise.allSettled(
      wallets.map(wallet =>
        client.getTransferredCollectiblesForWallet(wallet, limit)
      )
    ).then(results =>
      results
        .filter(result => result.status === 'fulfilled')
        .map(
          result =>
            (result as PromiseFulfilledResult<{ asset_events: OpenSeaEvent[] }>)
              .value.asset_events
        )
        .flat()
    )
  }

  async getCreatedCollectiblesForWallet(
    wallet: string,
    limit = OPENSEA_NUM_ASSETS_LIMIT
  ): Promise<{ asset_events: OpenSeaEvent[] }> {
    return fetch(
      `${client.url}/events?account_address=${wallet}&limit=${limit}&event_type=created&only_opensea=false`
    ).then(r => r.json())
  }

  async getCreatedCollectiblesForMultipleWallets(
    wallets: string[],
    limit = OPENSEA_NUM_ASSETS_LIMIT
  ): Promise<OpenSeaEvent[]> {
    return Promise.allSettled(
      wallets.map(wallet =>
        client.getCreatedCollectiblesForWallet(wallet, limit)
      )
    ).then(results =>
      results
        .filter(result => result.status === 'fulfilled')
        .map(
          result =>
            (result as PromiseFulfilledResult<{ asset_events: OpenSeaEvent[] }>)
              .value.asset_events
        )
        .flat()
    )
  }

  async getCollectiblesForWallet(
    wallet: string,
    limit = OPENSEA_NUM_ASSETS_LIMIT
  ): Promise<{ assets: OpenSeaAsset[] }> {
    return fetch(
      `${client.url}/assets?owner=${wallet}&limit=${limit}`
    ).then(r => r.json())
  }

  async getCollectiblesForMultipleWallets(
    wallets: string[],
    limit = OPENSEA_NUM_ASSETS_LIMIT
  ): Promise<OpenSeaAsset[]> {
    return Promise.allSettled(
      wallets.map(wallet => client.getCollectiblesForWallet(wallet, limit))
    ).then(results =>
      results
        .filter(result => result.status === 'fulfilled')
        .map(
          result =>
            (result as PromiseFulfilledResult<{ assets: OpenSeaAsset[] }>).value
              .assets
        )
        .flat()
    )
  }

  async getAllCollectibles(wallets: string[]) {
    return Promise.all([
      client.getCollectiblesForMultipleWallets(wallets),
      client.getCreatedCollectiblesForMultipleWallets(wallets),
      client.getTransferredCollectiblesForMultipleWallets(wallets)
    ]).then(async ([assets, creationEvents, transferEvents]) => {
      const filteredAssets = assets.filter(
        asset => asset && isAssetValid(asset)
      )
      const collectibles = await Promise.all(
        filteredAssets.map(async asset => await assetToCollectible(asset))
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
          event =>
            event?.asset &&
            isAssetValid(event.asset) &&
            !isNotFromNullAddress(event)
        )
        .reduce((acc: { [key: string]: OpenSeaEvent }, curr) => {
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
        Object.entries(firstOwnershipTransferEvents).map(async entry => {
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
          .filter(event => event?.asset && isAssetValid(event.asset))
          .map(async event => {
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
          event =>
            event?.asset &&
            isAssetValid(event.asset) &&
            isNotFromNullAddress(event)
        )
        .reduce((acc: { [key: string]: OpenSeaEvent }, curr) => {
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
        Object.values(latestTransferEventsMap).map(async event => {
          const { token_id, asset_contract } = event.asset
          const id = `${token_id}:::${asset_contract?.address ?? ''}`
          if (ownedCollectibleKeySet.has(id)) {
            collectiblesMap[id] = {
              ...collectiblesMap[id],
              dateLastTransferred: event.created_date
            }
          } else if (wallets.includes(event.to_account.address)) {
            ownedCollectibleKeySet.add(id)
            collectiblesMap[id] = await transferEventToCollectible(event)
          }
          return event
        })
      )

      return Object.values(collectiblesMap)
    })
  }
}

const client = new OpenSeaClient()

export default client
