import { HeliusNFT } from './types'

const HELIUS_NUM_ASSETS_PER_PAGE_LIMIT = 1000

export class HeliusClient {
  private readonly apiUrl: string

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl
  }

  async getNFTsForWallet(wallet: string): Promise<HeliusNFT[]> {
    let nfts: HeliusNFT[] = []
    try {
      let page = 1
      while (true) {
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
              page,
              limit: HELIUS_NUM_ASSETS_PER_PAGE_LIMIT,
              sortBy: {
                sortBy: 'id',
                sortDirection: 'asc'
              },
              displayOptions: {
                showUnverifiedCollections: false,
                showCollectionMetadata: true
              }
            }
          })
        })
        const { result } = await response.json()
        nfts = [...nfts, ...result.items]
        const isEmptyResult = result.items.length === 0
        const isResultLengthBelowLimit =
          result.items.length < HELIUS_NUM_ASSETS_PER_PAGE_LIMIT
        if (isEmptyResult || isResultLengthBelowLimit) {
          break
        } else {
          page++
        }
      }
      return nfts
    } catch (e) {
      console.error(
        `Encountered error while fetching nfts from Helius for wallet ${wallet}: Returning nfts obtained so far...\nError: ${e}`
      )
      return nfts
    }
  }
}
