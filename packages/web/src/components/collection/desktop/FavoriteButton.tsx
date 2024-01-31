import { useCallback } from 'react'

import {
  FavoriteSource,
  Collection,
  SmartCollection,
  ID
} from '@audius/common/models'
import {
  accountSelectors,
  collectionPageSelectors,
  collectionsSocialActions,
  CommonState
} from '@audius/common/store'
import { ButtonProps, ButtonType, IconHeart } from '@audius/stems'
import { useDispatch, useSelector } from 'react-redux'

import { Tooltip } from 'components/tooltip'

import { EntityActionButton } from '../../entity-page/EntityActionButton'

const { getCollection } = collectionPageSelectors
const { getAccountCollections } = accountSelectors
const {
  saveCollection,
  unsaveCollection,
  saveSmartCollection,
  unsaveSmartCollection
} = collectionsSocialActions

const messages = {
  favorite: 'Favorite',
  favorited: 'Favorited',
  unfavorite: 'Unfavorite'
}

type FavoriteButtonProps = Partial<ButtonProps> & {
  collectionId?: ID
  isOwner?: boolean
}

export const FavoriteButton = (props: FavoriteButtonProps) => {
  const { collectionId, isOwner, type, ...other } = props

  const userPlaylists = useSelector(getAccountCollections)

  const collection =
    (useSelector((state: CommonState) =>
      getCollection(state, collectionId ? { id: collectionId } : undefined)
    ) as SmartCollection | Collection) ?? {}

  const { has_current_user_saved, playlist_name } = collection
  const saveCount = (collection as Collection).save_count ?? 0

  const isSaved =
    has_current_user_saved || (collectionId && collectionId in userPlaylists)

  const dispatch = useDispatch()

  const handleFavorite = useCallback(() => {
    if (collectionId) {
      if (isSaved) {
        dispatch(unsaveCollection(collectionId, FavoriteSource.COLLECTION_PAGE))
      } else {
        dispatch(saveCollection(collectionId, FavoriteSource.COLLECTION_PAGE))
      }
    } else {
      if (isSaved) {
        dispatch(
          unsaveSmartCollection(playlist_name, FavoriteSource.COLLECTION_PAGE)
        )
      } else {
        dispatch(
          saveSmartCollection(playlist_name, FavoriteSource.COLLECTION_PAGE)
        )
      }
    }
  }, [dispatch, isSaved, collectionId, playlist_name])

  return (
    <Tooltip
      disabled={isOwner || saveCount === 0}
      text={isSaved ? messages.unfavorite : messages.favorite}
    >
      <EntityActionButton
        type={type ?? (isSaved ? ButtonType.SECONDARY : ButtonType.COMMON)}
        text={isSaved ? messages.favorited : messages.favorite}
        leftIcon={<IconHeart />}
        onClick={handleFavorite}
        {...other}
      />
    </Tooltip>
  )
}
