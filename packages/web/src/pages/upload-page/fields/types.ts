import {
  FieldVisibility,
  Nullable,
  AccessConditions,
  TrackAvailabilityType
} from '@audius/common'

export type FieldProps = {
  name: string
  label: string
  required?: boolean
  errorMessage?: string
}

export const IS_SCHEDULED_RELEASE = 'is_scheduled_release'
export const IS_UNLISTED = 'is_unlisted'
export const IS_STREAM_GATED = 'is_stream_gated'
export const STREAM_CONDITIONS = 'stream_conditions'

export const AVAILABILITY_TYPE = 'availability_type'
export const SPECIAL_ACCESS_TYPE = 'special_access_type'
export const FIELD_VISIBILITY = 'field_visibility'
export const PRICE = 'premium_conditions.usdc_purchase.price'
export const PRICE_HUMANIZED = 'price_humanized'
export const PREVIEW = 'preview_start_seconds'

export type AccessAndSaleFormValues = {
  [IS_UNLISTED]: boolean
  [AVAILABILITY_TYPE]: TrackAvailabilityType
  [STREAM_CONDITIONS]: Nullable<AccessConditions>
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
