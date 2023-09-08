import {
  Nullable,
  PremiumConditions,
  TrackAvailabilityType
} from '@audius/common'

export enum PremiumTrackMetadataField {
  IS_PREMIUM = 'is_premium',
  PREMIUM_CONDITIONS = 'premium_conditions',
  PREVIEW = 'preview_start_seconds'
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
  [PremiumTrackMetadataField.PREVIEW]: Nullable<number>
  [UnlistedTrackMetadataField.UNLISTED]: boolean
  [UnlistedTrackMetadataField.GENRE]: boolean
  [UnlistedTrackMetadataField.MOOD]: boolean
  [UnlistedTrackMetadataField.TAGS]: boolean
  [UnlistedTrackMetadataField.SHARE]: boolean
  [UnlistedTrackMetadataField.PLAYS]: boolean
}

export type TrackAvailabilitySelectionProps = {
  state: TrackMetadataState
  onStateUpdate: (
    premiumConditions: Nullable<PremiumConditions>,
    availabilityType: TrackAvailabilityType
  ) => void
  disabled?: boolean
}
