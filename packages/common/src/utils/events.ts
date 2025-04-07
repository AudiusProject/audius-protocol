import { EventEventTypeEnum } from '@audius/sdk'
import dayjs from 'dayjs'

import { Event } from '~/models'

/**
 * Finds the first active remix contest event from a list of events
 */
export const findActiveRemixContest = (
  events: (Event | undefined)[] | undefined
) => {
  if (!events) return null
  const now = dayjs()
  return (
    events.find(
      (event) =>
        event &&
        event.eventType === EventEventTypeEnum.RemixContest &&
        dayjs(event.endDate).isAfter(now)
    ) ?? null
  )
}
