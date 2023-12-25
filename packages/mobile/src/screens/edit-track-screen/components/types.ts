import type { Nullable, AccessConditions } from '@audius/common'

export type TrackAvailabilitySelectionProps = {
  selected: boolean
  disabled?: boolean
  disabledContent?: boolean
  previousStreamConditions?: Nullable<AccessConditions>
}
