import { full } from '@audius/sdk'
import snakecaseKeys from 'snakecase-keys'

import { Repost } from '~/models/Repost'
import { removeNullable } from '~/utils'
import { decodeHashId } from '~/utils/hashIds'

export const repostFromSDK = (input: full.Repost): Repost | undefined => {
  const repost = snakecaseKeys(input)
  const decodedRepostItemId = decodeHashId(input.repostItemId)
  const decodedUserId = decodeHashId(input.userId)
  if (!decodedRepostItemId || !decodedUserId) {
    return undefined
  }

  return {
    ...repost,
    repost_item_id: decodedRepostItemId,
    user_id: decodedUserId
  }
}

export const repostListFromSDK = (input?: full.Repost[]) =>
  input ? input.map((d) => repostFromSDK(d)).filter(removeNullable) : []
