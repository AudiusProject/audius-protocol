type AssetContract = {
  address: string
  asset_contract_type: string
  created_date: string
  name: string
  nft_version: string
  opensea_version: string | null
  owner: number | null
  schema_name: string
  symbol: string
  total_supply: number
  description: string | null
  external_link: string | null
  image_url: string | null
  default_to_fiat: boolean
  dev_buyer_fee_basis_points: number
  dev_seller_fee_basis_points: number
  only_proxied_transfers: boolean
  opensea_buyer_fee_basis_points: number
  opensea_seller_fee_basis_points: number
  buyer_fee_basis_points: number
  seller_fee_basis_points: number
  payout_address: string | null
} | null

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
  name: string | null
  description: string | null
  external_link: string | null
  permalink: string | null
  image_url: string | null
  image_preview_url: string | null
  image_thumbnail_url: string | null
  image_original_url: string | null
  animation_url: string | null
  animation_original_url: string | null
  youtube_url: string | null
  background_color: string | null
  owner: AssetOwner
  creator: AssetCreator
  asset_contract: AssetContract
}

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
