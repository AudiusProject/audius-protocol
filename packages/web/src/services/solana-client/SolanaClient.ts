import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Connection, PublicKey } from '@solana/web3.js'

import { solanaNFTToCollectible } from 'containers/collectibles/solCollectibleHelpers'
import { Collectible, CollectibleState } from 'containers/collectibles/types'

import { MetaplexNFT, SolanaNFTType } from './types'

const SOLANA_CLUSTER_ENDPOINT = process.env.REACT_APP_SOLANA_CLUSTER_ENDPOINT
const METADATA_PROGRAM_ID = process.env.REACT_APP_METADATA_PROGRAM_ID

const METADATA_PROGRAM_ID_PUBLIC_KEY = new PublicKey(METADATA_PROGRAM_ID!)

class SolanaClient {
  private connection = new Connection(SOLANA_CLUSTER_ENDPOINT!, 'confirmed')

  /**
   * for each given wallet:
   * - get and parse its token accounts to get the mint addresses
   * - filter out tokens whose decimal places are not 0
   * - find the metadata PDAs for the mint addresses
   * - get the account infos for the PDAs if they exist
   * - get the metadata urls from the account infos and fetch the metadatas
   * - transform the nft metadatas to Audius-domain collectibles
   */
  async getAllCollectibles(wallets: string[]): Promise<CollectibleState> {
    const tokenAccountsByOwnerAddress = await Promise.all(
      wallets.map(async address =>
        client.connection.getParsedTokenAccountsByOwner(
          new PublicKey(address),
          {
            programId: TOKEN_PROGRAM_ID
          }
        )
      )
    )

    const potentialNFTsByOwnerAddress = tokenAccountsByOwnerAddress
      .map(ta => ta.value)
      // value is an array of parsed token info
      .map((value, i) => {
        const mintAddresses = value
          .map(v => ({
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
            async mintAddress =>
              (
                await PublicKey.findProgramAddress(
                  [
                    Buffer.from('metadata'),
                    METADATA_PROGRAM_ID_PUBLIC_KEY.toBytes(),
                    new PublicKey(mintAddress).toBytes()
                  ],
                  METADATA_PROGRAM_ID_PUBLIC_KEY
                )
              )[0]
          )
        )

        const accountInfos = await client.connection.getMultipleAccountsInfo(
          programAddresses
        )
        const nonNullInfos = accountInfos?.filter(Boolean) ?? []

        const metadataUrls = nonNullInfos
          .map(x => client._utf8ArrayToNFTType(x!.data))
          .filter(Boolean) as { type: SolanaNFTType; url: string }[]

        const results = await Promise.all(
          metadataUrls.map(async item =>
            fetch(item!.url)
              .then(res => res.json())
              .catch(() => null)
          )
        )

        const metadatas = results.map((metadata, i) => ({
          metadata,
          type: metadataUrls[i].type
        }))

        return metadatas.filter(r => !!r.metadata)
      })
    )

    const solanaCollectibles = await Promise.all(
      nfts.map(async (nftsForAddress, i) => {
        const collectibles = await Promise.all(
          nftsForAddress.map(
            async nft =>
              await solanaNFTToCollectible(nft.metadata, wallets[i], nft.type)
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
  }

  _utf8ArrayToNFTType(
    array: Uint8Array
  ): { type: SolanaNFTType; url: string } | null {
    const str = new TextDecoder().decode(array)
    const query = 'https://'
    const startIndex = str.indexOf(query)

    // metaplex standard nfts live in arweave, see link below
    // https://github.com/metaplex-foundation/metaplex/blob/81023eb3e52c31b605e1dcf2eb1e7425153600cd/js/packages/web/src/contexts/meta/processMetaData.ts#L29
    const isMetaplex = str.includes('arweave')

    // star atlas nfts live in https://galaxy.staratlas.com/nfts/...
    const isStarAtlas = str.includes('staratlas')

    const isInvalid = (!isMetaplex && !isStarAtlas) || startIndex === -1
    if (isInvalid) {
      return null
    }

    const suffix = isMetaplex ? '/' : '/nfts/'
    const suffixIndex = str.indexOf(suffix, startIndex + query.length)
    if (suffixIndex === -1) {
      return null
    }

    const hashLength = isMetaplex ? 43 : 44
    const endIndex = suffixIndex + suffix.length + hashLength

    const url = str.substring(startIndex, endIndex)
    return {
      type: isMetaplex ? SolanaNFTType.METAPLEX : SolanaNFTType.STAR_ATLAS,
      url
    }
  }
}

const client = new SolanaClient()

export default client
