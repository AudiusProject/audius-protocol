import type { AccessType } from '@audius/common/models'
import { formatDate } from '@audius/common/utils'

import type { IconComponent } from '@audius/harmony-native'
import { icons } from '@audius/harmony-native'

export const getAccessTypeIcon = (type: AccessType): IconComponent => {
  switch (type) {
    case 'collectible':
      return icons.Collectible
    case 'premium':
      return icons.Star
    case 'gated':
      return icons.Lock
    case 'scheduled':
      return icons.Calendar
    default:
      return icons.Lock
  }
}

export const getAccessTypeLabel = (
  type: AccessType,
  scheduledReleaseDate?: string
): string => {
  switch (type) {
    case 'collectible':
      return 'Collectible'
    case 'premium':
      return 'Premium'
    case 'gated':
      return 'Exclusive'
    case 'scheduled':
      return scheduledReleaseDate
        ? `Available ${formatDate(scheduledReleaseDate)}`
        : 'Scheduled'
    default:
      return 'Locked'
  }
}
