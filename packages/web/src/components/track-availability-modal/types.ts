import { Nullable, PremiumConditions } from '@audius/common'

export enum PremiumTrackMetadataField {
  IS_PREMIUM = 'is_premium',
  PREMIUM_CONDITIONS = 'premium_conditions'
}

export enum UnlistedTrackMetadataField {
  UNLISTED = 'unlisted',
  GENRE = 'genre',
  MOOD = 'mood',
  TAGS = 'tags',
  SHARE = 'share',
  PLAYS = 'plays'
}

export type TrackMetadataState = {
  [PremiumTrackMetadataField.IS_PREMIUM]: boolean
  [PremiumTrackMetadataField.PREMIUM_CONDITIONS]: Nullable<PremiumConditions>
  [UnlistedTrackMetadataField.UNLISTED]: boolean
  [UnlistedTrackMetadataField.GENRE]: boolean
  [UnlistedTrackMetadataField.MOOD]: boolean
  [UnlistedTrackMetadataField.TAGS]: boolean
  [UnlistedTrackMetadataField.SHARE]: boolean
  [UnlistedTrackMetadataField.PLAYS]: boolean
}

export type TrackAvailabilitySelectionProps = {
  selected: boolean
  state: TrackMetadataState
  onStateUpdate: (...args: any[]) => any
  disabled?: boolean
}
