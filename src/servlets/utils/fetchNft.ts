import { FetchNFTClient } from '@audius/fetch-nft'

export const nftClient = new FetchNFTClient({
  openSeaConfig: {
    apiEndpoint: process.env.OPENSEA_ENDPOINT,
  },
  solanaConfig: {
    rpcEndpoint: process.env.SOLANA_RPC_ENDPOINT,
  },
})
