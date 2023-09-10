import { Metadata } from '@metaplex-foundation/mpl-token-metadata'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Connection, PublicKey } from '@solana/web3.js'

import { Collectible, CollectibleState } from '../../models'

import { solanaNFTToCollectible } from './solCollectibleHelpers'
import { SolanaNFTType } from './types'

type SolanaClientArgs = {
  solanaClusterEndpoint: string | undefined
  metadataProgramId: string | undefined
}
export class SolanaClient {
  private connection: Connection | null = null
  private metadataProgramIdPublicKey: PublicKey

  constructor({ solanaClusterEndpoint, metadataProgramId }: SolanaClientArgs) {
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

  /**
   * for each given wallet:
   * - get and parse its token accounts to get the mint addresses
   * - filter out tokens whose decimal places are not 0
   * - find the metadata PDAs for the mint addresses
   * - get the account infos for the PDAs if they exist
   * - get the metadata urls from the account infos and fetch the metadatas
   * - transform the nft metadatas to Audius-domain collectibles
   */
  getAllCollectibles = async (wallets: string[]): Promise<CollectibleState> => {
    try {
      if (this.connection === null) throw new Error('No connection')
      const connection = this.connection

      const tokenAccountsByOwnerAddress = await Promise.all(
        wallets.map(async (address) =>
          connection.getParsedTokenAccountsByOwner(new PublicKey(address), {
            programId: TOKEN_PROGRAM_ID
          })
        )
      )

      const potentialNFTsByOwnerAddress = tokenAccountsByOwnerAddress
        .map((ta) => ta.value)
        // value is an array of parsed token info
        .map((value) => {
          const mintAddresses = value
            .map((v) => ({
              mint: v.account.data.parsed.info.mint,
              tokenAmount: v.account.data.parsed.info.tokenAmount
            }))
            .filter(({ tokenAmount }) => {
              // Filter out the token if we don't have any balance
              const ownsNFT = tokenAmount.amount !== '0'
              // Filter out the tokens that don't have 0 decimal places.
              // NFTs really should have 0
              const hasNoDecimals = tokenAmount.decimals === 0
              return ownsNFT && hasNoDecimals
            })
            .map(({ mint }) => mint)
          return { mintAddresses }
        })

      const nfts = await Promise.all(
        potentialNFTsByOwnerAddress.map(async ({ mintAddresses }) => {
          const programAddresses = await Promise.all(
            mintAddresses.map(
              async (mintAddress) =>
                (
                  await PublicKey.findProgramAddress(
                    [
                      Buffer.from('metadata'),
                      this.metadataProgramIdPublicKey.toBytes(),
                      new PublicKey(mintAddress).toBytes()
                    ],
                    this.metadataProgramIdPublicKey
                  )
                )[0]
            )
          )

          const chainMetadatas = await Promise.all(
            programAddresses.map(async (address) => {
              try {
                return await Metadata.fromAccountAddress(connection, address)
              } catch (e) {
                return null
              }
            })
          )
          const metadataUris = chainMetadatas.map((m) => m?.data.uri)

          const results = await Promise.all(
            metadataUris.map(async (url) => {
              if (!url) return Promise.resolve(null)
              // Remove control characters from url
              const sanitizedURL = url.replace(
                // eslint-disable-next-line
                /[\u0000-\u001F\u007F-\u009F]/g,
                ''
              )

              return fetch(sanitizedURL)
                .then((res) => res.json())
                .catch(() => null)
            })
          )

          return results
            .map((nftMetadata, i) => ({
              metadata: nftMetadata,
              chainMetadata: chainMetadatas[i],
              type: chainMetadatas[i]?.data.uri.includes('staratlas')
                ? SolanaNFTType.STAR_ATLAS
                : SolanaNFTType.METAPLEX
            }))
            .filter((r) => !!r.metadata && !!r.chainMetadata && !!r.type)
        })
      )

      const solanaCollectibles = await Promise.all(
        nfts.map(async (nftsForAddress, i) => {
          const collectibles = await Promise.all(
            nftsForAddress.map(
              async (nft) =>
                await solanaNFTToCollectible(
                  nft.metadata,
                  wallets[i],
                  nft.type,
                  nft.chainMetadata
                )
            )
          )
          return collectibles.filter(Boolean) as Collectible[]
        })
      )

      return solanaCollectibles.reduce(
        (result, collectibles, i) => ({
          ...result,
          [wallets[i]]: collectibles
        }),
        {} as CollectibleState
      )
    } catch (e) {
      console.error('Unable to get collectibles', e)
      return Promise.resolve({})
    }
  }

  getNFTMetadataFromMint = async (mintAddress: string) => {
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
