import { ID } from 'common/models/Identifiers'
import { Nullable } from 'common/utils/typeUtils'

export const QUEUE_AUTOPLAY = 'QUEUE/QUEUE_AUTOPLAY'

export const queueAutoplay = (
  genre: string,
  exclusionList: number[],
  currentUserId: Nullable<ID>
) => ({
  type: QUEUE_AUTOPLAY,
  genre,
  exclusionList,
  currentUserId
})
