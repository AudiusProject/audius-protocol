import { Nullable } from '@audius/common'

type AssetContract = {
  address: Nullable<string>
  asset_contract_type: string
  created_date: string
  name: string
  nft_version: string
  opensea_version: Nullable<string>
  owner: Nullable<number>
  schema_name: string
  symbol: string
  total_supply: number
  description: Nullable<string>
  external_link: Nullable<string>
  image_url: Nullable<string>
  default_to_fiat: boolean
  dev_buyer_fee_basis_points: number
  dev_seller_fee_basis_points: number
  only_proxied_transfers: boolean
  opensea_buyer_fee_basis_points: number
  opensea_seller_fee_basis_points: number
  buyer_fee_basis_points: number
  seller_fee_basis_points: number
  payout_address: Nullable<string>
}

type AssetPerson = {
  user: {
    username: string
  }
  address: string
} | null
type AssetOwner = AssetPerson
type AssetCreator = AssetPerson
export type OpenSeaAsset = {
  token_id: string
  name: Nullable<string>
  description: Nullable<string>
  external_link: Nullable<string>
  permalink: Nullable<string>
  image_url: Nullable<string>
  image_preview_url: Nullable<string>
  image_thumbnail_url: Nullable<string>
  image_original_url: Nullable<string>
  animation_url: Nullable<string>
  animation_original_url: Nullable<string>
  youtube_url: Nullable<string>
  background_color: Nullable<string>
  owner: Nullable<AssetOwner>
  creator: Nullable<AssetCreator>
  asset_contract: Nullable<AssetContract>
}

export type OpenSeaAssetExtended = OpenSeaAsset & { wallet: string }

export type OpenSeaEvent = {
  id: number
  created_date: string
  from_account: {
    address: string
  }
  to_account: {
    address: string
  }
  asset: OpenSeaAsset
}

export type OpenSeaEventExtended = Omit<OpenSeaEvent, 'asset'> & {
  asset: OpenSeaAssetExtended
  wallet: string
}
