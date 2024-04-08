import type { Metadata } from '@metaplex-foundation/mpl-token-metadata'

import { Nullable } from '../../utils/typeUtils'
import { HeliusNFT } from '../helius'

export enum SolanaNFTType {
  HELIUS = 'HELIUS',
  METAPLEX = 'METAPLEX',
  STAR_ATLAS = 'STAR_ATLAS'
}

type MetaplexNFTCreator = {
  address: string
  verified: boolean
  share: number
}

export type MetaplexNFTPropertiesFile = {
  type: string
  uri: string
}

type MetaplexNFTProperties = {
  files: (string | MetaplexNFTPropertiesFile)[]
  creators: MetaplexNFTCreator[]
  category?: string
}

// may live outside arweave and still have this format
// examples:
// https://cdn.piggygang.com/meta/3ad355d46a9cb2ee57049db4df57088f.json
// https://d1b6hed00dtfsr.cloudfront.net/9086.json
// Also, some nft metadatas are minimal, hence all the many nullable properties
// e.g. https://ipfs.io/ipfs/QmS2BZecgTM5jy1PWzFbxcP6jDsLoq5EbGNmmwCPbi7YNH/6177.json
export type MetaplexNFT = {
  name: string
  description: Nullable<string>
  symbol: Nullable<string>
  image: string
  animation_url: Nullable<string>
  external_url: Nullable<string>
  properties: Nullable<MetaplexNFTProperties>
}

// example: https://galaxy.staratlas.com/nfts/2iMhgB4pbdKvwJHVyitpvX5z1NBNypFonUgaSAt9dtDt
export type StarAtlasNFT = {
  _id: string
  name: string
  description: string
  symbol: string
  image: string
  media: {
    thumbnailUrl: string // may be empty string
  }
  deactivated: boolean
  createdAt: string
  solanaChainMetadata: Metadata
}

export type SolanaNFT = HeliusNFT | MetaplexNFT | StarAtlasNFT

export type Blocklist = {
  blocklist: string[] // list of urls
  nftBlocklist: string[] // list of nft ids
  stringFilters: {
    nameContains: string[]
    symbolContains: string[]
  }
  contentHash: string
}
