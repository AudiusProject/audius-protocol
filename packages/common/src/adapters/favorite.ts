import { full, OptionalHashId } from '@audius/sdk'
import { omit } from 'lodash'
import snakecaseKeys from 'snakecase-keys'

import { Favorite, FavoriteType } from '~/models/Favorite'

export const favoriteFromSDK = (input: full.Favorite): Favorite | undefined => {
  const decodedSaveItemId = OptionalHashId.parse(input.favoriteItemId)
  const decodedUserId = OptionalHashId.parse(input.userId)
  if (!decodedSaveItemId || !decodedUserId) {
    return undefined
  }

  return {
    // 'save' is renamed to 'favorite' in the model
    ...omit(snakecaseKeys(input), ['favorite_item_id', 'favorite_type']),
    save_item_id: decodedSaveItemId,
    save_type: input.favoriteType as FavoriteType,
    user_id: decodedUserId
  }
}
