import { ACCEPTED_ROUTES } from './constants'

export type AcceptedRouteKey = keyof typeof ACCEPTED_ROUTES

export type AssetDetailProps = {
  slug: AcceptedRouteKey
}
