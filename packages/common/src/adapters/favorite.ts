import { full } from '@audius/sdk'
import { omit } from 'lodash'
import snakecaseKeys from 'snakecase-keys'

import { Favorite, FavoriteType } from '~/models/Favorite'
import { decodeHashId, removeNullable } from '~/utils'

export const favoriteFromSDK = (input: full.Favorite): Favorite | undefined => {
  const favorite = snakecaseKeys(input)
  const decodedSaveItemId = decodeHashId(input.favoriteItemId)
  const decodedUserId = decodeHashId(input.userId)
  if (!decodedSaveItemId || !decodedUserId) {
    return undefined
  }

  return {
    // 'save' is renamed to 'favorite' in the model
    ...omit(favorite, ['favorite_item_id', 'favorite_type']),
    save_item_id: decodedSaveItemId,
    user_id: decodedUserId,
    save_type:
      input.favoriteType.toLowerCase() === 'track'
        ? FavoriteType.TRACK
        : FavoriteType.PLAYLIST
  }
}

export const favoriteListFromSDK = (input?: full.Favorite[]) =>
  input ? input.map((d) => favoriteFromSDK(d)).filter(removeNullable) : []
