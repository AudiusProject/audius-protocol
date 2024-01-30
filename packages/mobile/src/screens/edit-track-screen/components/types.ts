import type { AccessConditions } from '@audius/common/models'
import type { Nullable } from '@audius/common/utils'

export type TrackAvailabilitySelectionProps = {
  selected: boolean
  disabled?: boolean
  disabledContent?: boolean
  previousStreamConditions?: Nullable<AccessConditions>
  isScheduledRelease?: boolean
  isUnlisted?: boolean
}
