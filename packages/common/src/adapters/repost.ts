import { full, HashId } from '@audius/sdk'
import snakecaseKeys from 'snakecase-keys'

import { Repost } from '~/models/Repost'

export const repostFromSDK = (input: full.Repost): Repost | undefined => {
  const decodedRepostItemId = HashId.parse(input.repostItemId)
  const decodedUserId = HashId.parse(input.userId)
  if (!decodedRepostItemId || !decodedUserId) {
    return undefined
  }

  return {
    ...snakecaseKeys(input),
    repost_item_id: decodedRepostItemId,
    user_id: decodedUserId
  }
}
