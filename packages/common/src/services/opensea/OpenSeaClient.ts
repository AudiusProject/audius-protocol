import { Nullable } from '~/utils'

import { OpenSeaCollection, OpenSeaEvent, OpenSeaNft } from './types'

const OPENSEA_NUM_ASSETS_LIMIT = 200
const OPENSEA_NUM_EVENTS_LIMIT = 50

export class OpenSeaClient {
  private readonly apiUrl: string

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl
  }

  async getCollectionMetadata(
    collection: string
  ): Promise<Nullable<OpenSeaCollection>> {
    try {
      const res = await fetch(`${this.apiUrl}/api/v2/collections/${collection}`)
      return res.json()
    } catch (e) {
      console.error(e)
      return null
    }
  }

  async getNftTransferEventsForWallet(
    wallet: string,
    limit = OPENSEA_NUM_EVENTS_LIMIT
  ): Promise<OpenSeaEvent[]> {
    let res: Response
    let json: { next: string | undefined; asset_events: OpenSeaEvent[] }
    let events: OpenSeaEvent[]
    let next: string | undefined
    res = await fetch(
      `${this.apiUrl}/api/v2/events/accounts/${wallet}?limit=${limit}&event_type=transfer&chain=ethereum`
    )
    json = await res.json()
    next = json.next
    events = json.asset_events
    while (next) {
      res = await fetch(
        `${this.apiUrl}/api/v2/events/accounts/${wallet}?limit=${limit}&event_type=transfer&chain=ethereum&next=${next}`
      )
      json = await res.json()
      next = json.next
      events = [...events, ...json.asset_events]
    }
    return events.map((event) => ({ ...event, wallet }))
  }

  async getNftsForWallet(
    wallet: string,
    limit = OPENSEA_NUM_ASSETS_LIMIT
  ): Promise<OpenSeaNft[]> {
    let res: Response
    let json: { next: string | undefined; nfts: OpenSeaNft[] }
    let nfts: OpenSeaNft[]
    let next: string | undefined
    res = await fetch(
      `${this.apiUrl}/api/v2/chain/ethereum/account/${wallet}/nfts?limit=${limit}`
    )
    json = await res.json()
    next = json.next
    nfts = json.nfts
    while (next) {
      res = await fetch(
        `${this.apiUrl}/api/v2/chain/ethereum/account/${wallet}/nfts?limit=${limit}&next=${next}`
      )
      json = await res.json()
      next = json.next
      nfts = [...nfts, ...json.nfts]
    }
    return nfts.map((nft) => ({ ...nft, wallet }))
  }
}
