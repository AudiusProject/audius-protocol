import { ASSET_ROUTES } from './constants'

export type AssetName = keyof typeof ASSET_ROUTES

export type AssetDetailProps = {
  assetName: AssetName
}
