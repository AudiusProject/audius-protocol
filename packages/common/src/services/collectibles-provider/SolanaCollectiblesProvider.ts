import { Collectible, CollectibleState } from '~/models'
import { CollectiblesProvider } from './CollectiblesProvider'
import { allSettled } from '~/utils'
import { HeliusClient } from '../helius'
import { HeliusResponse } from '../helius/types'
import { Connection, PublicKey } from '@solana/web3.js'
import { SolanaNFTType } from '../solana-client/types'
import { solanaNFTToCollectible } from '../solana-client/solCollectibleHelpers'

type SolanaCollectiblesProviderCtorArgs = {
  heliusClient: HeliusClient
  solanaClusterEndpoint?: string
  metadataProgramId?: string
}

export class SolanaCollectiblesProvider implements CollectiblesProvider {
  private readonly heliusClient: HeliusClient
  private metadataProgramIdPublicKey: PublicKey
  private connection: Connection | null = null

  constructor({
    heliusClient,
    solanaClusterEndpoint,
    metadataProgramId
  }: SolanaCollectiblesProviderCtorArgs) {
    this.heliusClient = heliusClient
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

  async getCollectibles(wallets: string[]): Promise<CollectibleState> {
    const results = await allSettled(
      wallets.map((wallet) => this.heliusClient.getNFTsForWallet(wallet))
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
