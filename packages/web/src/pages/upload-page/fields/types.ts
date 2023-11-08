import {
  FieldVisibility,
  Nullable,
  PremiumConditions,
  TrackAvailabilityType
} from '@audius/common'

export type FieldProps = {
  name: string
  label: string
  required?: boolean
  errorMessage?: string
}

export const IS_UNLISTED = 'is_unlisted'
export const IS_PREMIUM = 'is_premium'
export const PREMIUM_CONDITIONS = 'premium_conditions'

export const AVAILABILITY_TYPE = 'availability_type'
export const SPECIAL_ACCESS_TYPE = 'special_access_type'
export const FIELD_VISIBILITY = 'field_visibility'
export const PRICE = 'premium_conditions.usdc_purchase.price'
export const PRICE_HUMANIZED = 'price_humanized'
export const PREVIEW = 'preview_start_seconds'

export type AccessAndSaleFormValues = {
  [IS_UNLISTED]: boolean
  [AVAILABILITY_TYPE]: TrackAvailabilityType
  [PREMIUM_CONDITIONS]: Nullable<PremiumConditions>
  [SPECIAL_ACCESS_TYPE]: Nullable<SpecialAccessType>
  [FIELD_VISIBILITY]: FieldVisibility
  [PRICE_HUMANIZED]: string
  [PREVIEW]?: number
}

export enum SpecialAccessType {
  TIP = 'tip',
  FOLLOW = 'follow'
}

export type TrackAvailabilityFieldsProps = {
  disabled?: boolean
}
