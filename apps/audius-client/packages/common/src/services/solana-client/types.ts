import { Nullable } from '../../utils/typeUtils'

export enum SolanaNFTType {
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
  category: string
  files: (string | MetaplexNFTPropertiesFile)[]
  creators: MetaplexNFTCreator[]
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
}

export type SolanaNFT = MetaplexNFT | StarAtlasNFT
