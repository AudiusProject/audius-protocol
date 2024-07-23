import { full } from '@audius/sdk'
import { omit } from 'lodash'
import snakecaseKeys from 'snakecase-keys'

import { Favorite, FavoriteType } from '~/models/Favorite'
import { decodeHashId } from '~/utils'

export const favoriteFromSDK = (input: full.Favorite): Favorite | undefined => {
  const decodedSaveItemId = decodeHashId(input.favoriteItemId)
  const decodedUserId = decodeHashId(input.userId)
  if (!decodedSaveItemId || !decodedUserId) {
    return undefined
  }

  return {
    // 'save' is renamed to 'favorite' in the model
    ...omit(snakecaseKeys(input), ['favorite_item_id', 'favorite_type']),
    save_item_id: decodedSaveItemId,
    user_id: decodedUserId,
    save_type: input.favoriteType as FavoriteType
  }
}
