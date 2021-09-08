import { Nullable } from 'utils/typeUtils'

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

export type MetaplexNFT = {
  name: string
  description: string
  symbol: string
  image: string
  animation_url: Nullable<string>
  external_url: string
  properties: MetaplexNFTProperties
}

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
