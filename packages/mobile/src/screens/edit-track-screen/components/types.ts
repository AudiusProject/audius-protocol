import type { Nullable } from '@audius/common'
import type { AccessConditions } from '@audius/common/models'

export type TrackAvailabilitySelectionProps = {
  selected: boolean
  disabled?: boolean
  disabledContent?: boolean
  previousStreamConditions?: Nullable<AccessConditions>
  isScheduledRelease?: boolean
  isUnlisted?: boolean
}
