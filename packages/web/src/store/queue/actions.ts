import { ID } from 'models/common/Identifiers'
import { Nullable } from 'utils/typeUtils'

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
