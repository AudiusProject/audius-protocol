import { full } from '@audius/sdk'
import snakecaseKeys from 'snakecase-keys'

import { Repost } from '~/models/Repost'
import { decodeHashId } from '~/utils/hashIds'

export const repostFromSDK = (input: full.Repost): Repost | undefined => {
  const decodedRepostItemId = decodeHashId(input.repostItemId)
  const decodedUserId = decodeHashId(input.userId)
  if (!decodedRepostItemId || !decodedUserId) {
    return undefined
  }

  return {
    ...snakecaseKeys(input),
    repost_item_id: decodedRepostItemId,
    user_id: decodedUserId
  }
}
