import { Nullable } from 'utils/typeUtils'

type SolanaNFTCreator = {
  address: string
  verified: boolean
  share: number
}

export type SolanaNFTPropertiesFile = {
  type: string
  uri: string
}

type SolanaNFTProperties = {
  category: string
  files: (string | SolanaNFTPropertiesFile)[]
  creators: SolanaNFTCreator[]
}

export type SolanaNFT = {
  name: string
  description: string
  symbol: string
  image: string
  animation_url: Nullable<string>
  external_url: string
  properties: SolanaNFTProperties
}
