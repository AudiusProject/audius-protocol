import { HeliusNFT } from './types'

const HELIUS_NUM_ASSETS_PER_PAGE_LIMIT = 1000

export class HeliusClient {
  private readonly apiUrl: string

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl
  }

  // todo: add pagination
  async getNFTsForWallet(wallet: string): Promise<HeliusNFT[]> {
    // let res: Response
    // let json: { next: string | undefined; nfts: HeliusNft[] }
    // let nfts: HeliusNft[]
    // let next: string | undefined
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: 'test-drive', // todo: what should this be
        jsonrpc: '2.0',
        method: 'getAssetsByOwner',
        params: {
          ownerAddress: wallet,
          page: 1,
          limit: HELIUS_NUM_ASSETS_PER_PAGE_LIMIT,
          after: '',
          before: '',
          displayOptions: {
            showUnverifiedCollections: false,
            showCollectionMetadata: true
          }
        }
      })
    })
    return response.json()
  }
}
