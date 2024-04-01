import { Connection, PublicKey } from '@solana/web3.js'

import { Collectible, CollectibleState } from '~/models'
import { Nullable, allSettled } from '~/utils'

import { HeliusClient } from '../helius'
import { HeliusNFT } from '../helius/types'

import { CollectiblesProvider } from './CollectiblesProvider'
import {
  isHeliusNFTValid,
  solanaNFTToCollectible
} from './solCollectibleHelpers'
import { Blocklist, SolanaNFTType } from './types'

const BLOCKLIST_URL =
  'https://raw.githubusercontent.com/solflare-wallet/blocklist-automation/master/dist/blocklist.json'

type SolanaCollectiblesProviderCtorArgs = {
  heliusClient: HeliusClient
  solanaClusterEndpoint?: string
  metadataProgramId?: string
}

export class SolanaCollectiblesProvider implements CollectiblesProvider {
  private readonly heliusClient: HeliusClient
  private readonly metadataProgramIdPublicKey: PublicKey
  private readonly connection: Nullable<Connection> = null
  private blocklist: Nullable<Blocklist> = null

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
    if (!this.blocklist) {
      try {
        const blocklistResponse = await fetch(BLOCKLIST_URL)
        this.blocklist = await blocklistResponse.json()
      } catch (e) {
        console.error('Could not fetch Solana nft blocklist', e)
      }
    }

    const results = await allSettled(
      wallets.map((wallet) => this.heliusClient.getNFTsForWallet(wallet))
    )

    const nfts = results
      .map((result, i) => ({ result, wallet: wallets[i] }))
      .filter(
        (
          item
        ): item is {
          result: PromiseFulfilledResult<HeliusNFT[]>
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
        const blocklist = this.blocklist
        if (blocklist) {
          return result.value
            .filter((nft) => isHeliusNFTValid(nft, blocklist))
            .map((nft) => ({ ...nft, wallet }))
        }
        return result.value.map((nft) => ({ ...nft, wallet }))
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

  getNftMetadataFromMint = async (mintAddress: string) => {
    if (this.connection === null) return

    try {
      const programAddress = (
        await PublicKey.findProgramAddress(
          [
            Buffer.from('metadata'),
            this.metadataProgramIdPublicKey.toBytes(),
            new PublicKey(mintAddress).toBytes()
          ],
          this.metadataProgramIdPublicKey
        )
      )[0]

      const { Metadata } = await import(
        '@metaplex-foundation/mpl-token-metadata'
      )
      const metadata = await Metadata.fromAccountAddress(
        this.connection,
        programAddress
      )
      const response = await fetch(metadata.data.uri.replaceAll('\x00', ''))
      const result = (await response.json()) ?? {}
      const imageUrl = result?.image
      return {
        metadata,
        imageUrl
      }
    } catch (e) {
      console.warn(
        `Could not get nft metadata for mint address ${mintAddress}, Error: ${
          (e as Error).message
        }`
      )
      return null
    }
  }
}
