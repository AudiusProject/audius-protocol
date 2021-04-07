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

class OpenSeaClient {
  readonly url = OPENSEA_API_URL

  async getTransferredCollectiblesForWallet(
    wallet: string,
    limit = 50
  ): Promise<{ asset_events: OpenSeaEvent[] }> {
    return fetch(
      `${client.url}/events?account_address=${wallet}&limit=${limit}&event_type=transfer&only_opensea=false`
    ).then(r => r.json())
  }

  async getTransferredCollectiblesForMultipleWallets(
    wallets: string[],
    limit = 50
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
    limit = 50
  ): Promise<{ asset_events: OpenSeaEvent[] }> {
    return fetch(
      `${client.url}/events?account_address=${wallet}&limit=${limit}&event_type=created&only_opensea=false`
    ).then(r => r.json())
  }

  async getCreatedCollectiblesForMultipleWallets(
    wallets: string[],
    limit = 50
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
    limit = 50
  ): Promise<{ assets: OpenSeaAsset[] }> {
    return fetch(
      `${client.url}/assets?owner=${wallet}&limit=${limit}`
    ).then(r => r.json())
  }

  async getCollectiblesForMultipleWallets(
    wallets: string[],
    limit = 50
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

  async getAllCollectibles(wallets: string[], imageAndVideoOnly = true) {
    return Promise.all([
      client.getCollectiblesForMultipleWallets(wallets),
      client.getCreatedCollectiblesForMultipleWallets(wallets),
      client.getTransferredCollectiblesForMultipleWallets(wallets)
    ]).then(([assets, creationEvents, transferEvents]) => {
      const collectiblesMap: { [key: string]: Collectible } = assets
        .filter(asset => asset && isAssetValid(asset))
        .reduce(
          (acc, curr) => ({
            ...acc,
            [curr.token_id]: assetToCollectible(curr)
          }),
          {}
        )
      const ownedCollectibleKeySet = new Set(Object.keys(collectiblesMap))

      creationEvents
        .filter(event => event && isAssetValid(event.asset))
        .forEach(event => {
          const tokenId = event.asset.token_id
          if (!ownedCollectibleKeySet.has(tokenId)) {
            collectiblesMap[tokenId] = creationEventToCollectible(event)
            ownedCollectibleKeySet.add(tokenId)
          }
        })

      const latestTransferEventsMap = transferEvents
        .filter(
          event =>
            event && isAssetValid(event.asset) && isNotFromNullAddress(event)
        )
        .reduce((acc: { [key: string]: OpenSeaEvent }, curr) => {
          if (
            acc[curr.asset.token_id] &&
            acc[curr.asset.token_id].created_date.localeCompare(
              curr.created_date
            ) > 0
          ) {
            return acc
          }
          return {
            ...acc,
            [curr.asset.token_id]: curr
          }
        }, {})
      Object.values(latestTransferEventsMap).forEach(event => {
        if (ownedCollectibleKeySet.has(event.asset.token_id)) {
          collectiblesMap[event.asset.token_id] = {
            ...collectiblesMap[event.asset.token_id],
            dateLastTransferred: event.created_date
          }
        } else if (wallets.includes(event.to_account.address)) {
          ownedCollectibleKeySet.add(event.asset.token_id)
          collectiblesMap[event.asset.token_id] = transferEventToCollectible(
            event
          )
        }
      })

      return Object.values(collectiblesMap)
    })
  }
}

const client = new OpenSeaClient()

export default client
