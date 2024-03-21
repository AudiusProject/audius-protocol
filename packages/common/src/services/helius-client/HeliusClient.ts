import { Connection, PublicKey } from '@solana/web3.js'

import { allSettled } from '~/utils/allSettled'

import { Collectible, CollectibleState } from '../../models'
import { solanaNFTToCollectible } from '../solana-client/solCollectibleHelpers'
import { SolanaNFTType } from '../solana-client/types'

import { HeliusNFT, HeliusResponse } from './types'

const HELIUS_DAS_API_KEY = '7ff12d25-ca35-4e43-85e7-a0abe2b5f6a8'
const HELIUS_NUM_ASSETS_PER_PAGE_LIMIT = 1000

type HeliusClientCtorArgs = {
  apiUrl: string
  solanaClusterEndpoint?: string
  metadataProgramId?: string
}

export class HeliusClient {
  private readonly apiUrl: string
  private connection: Connection | null = null
  private metadataProgramIdPublicKey: PublicKey

  constructor({
    apiUrl,
    solanaClusterEndpoint,
    metadataProgramId
  }: HeliusClientCtorArgs) {
    this.apiUrl = apiUrl
    this.metadataProgramIdPublicKey = new PublicKey(
      metadataProgramId || 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
    )
    try {
      this.connection = new Connection(solanaClusterEndpoint!, 'confirmed')
    } catch (e) {
      console.error('Could create Solana RPC connection', e)
      this.connection = null
    }
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

  async getAllCollectibles(wallets: string[]): Promise<CollectibleState> {
    const results = await allSettled(
      wallets.map((wallet) => this.getNFTsForWallet(wallet))
    )
    const nfts = results
      .map((result, i) => ({ result, wallet: wallets[i] }))
      .filter(
        (
          item
        ): item is {
          result: PromiseFulfilledResult<HeliusResponse>
          wallet: string
        } => {
          const { result, wallet } = item
          const fulfilled = 'value' in result
          if (!fulfilled)
            console.error(
              `Unable to get Helius NFTs for wallet ${wallet}: ${result.reason}`
            )
          return fulfilled
        }
      )
      .map(({ result, wallet }) => {
        // const { id, jsonrpc, result: nftResult } = result.value
        // const { items, limit, page, total } = nftResult
        const { result: nftResult } = result.value
        const { items } = nftResult
        return items.map((nft) => ({ ...nft, wallet }))
      })

    const solanaCollectibles = await Promise.all(
      nfts.map(async (nftsForWallet) => {
        if (nftsForWallet.length === 0) return []
        const wallet = nftsForWallet[0].wallet

        const mintAddresses = nftsForWallet.map((nft) => nft.id)
        const programAddresses = await Promise.all(
          mintAddresses.map(
            (mintAddress) =>
              PublicKey.findProgramAddressSync(
                [
                  Buffer.from('metadata'),
                  this.metadataProgramIdPublicKey.toBytes(),
                  new PublicKey(mintAddress).toBytes()
                ],
                this.metadataProgramIdPublicKey
              )[0]
          )
        )
        const chainMetadatas = await Promise.all(
          programAddresses.map(async (address) => {
            try {
              if (!this.connection) return null
              const { Metadata } = await import(
                '@metaplex-foundation/mpl-token-metadata'
              )
              return await Metadata.fromAccountAddress(this.connection, address)
            } catch (e) {
              return null
            }
          })
        )

        const collectibles = await Promise.all(
          nftsForWallet.map(
            async (nft, i) =>
              await solanaNFTToCollectible(
                nft,
                wallet,
                SolanaNFTType.HELIUS,
                chainMetadatas[i]
              )
          )
        )
        return collectibles.filter(Boolean) as Collectible[]
      })
    )

    const collectiblesMap = solanaCollectibles.reduce(
      (result, collectibles) => {
        if (collectibles.length === 0) return result
        result[collectibles[0].wallet] = collectibles
        return result
      },
      {}
    )

    return collectiblesMap
  }
}
