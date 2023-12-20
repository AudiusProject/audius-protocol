import type { Nullable, StreamConditions } from '@audius/common'

export type TrackAvailabilitySelectionProps = {
  selected: boolean
  disabled?: boolean
  disabledContent?: boolean
  previousStreamConditions?: Nullable<StreamConditions>
}
