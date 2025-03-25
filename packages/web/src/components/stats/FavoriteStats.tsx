import { useCallback } from 'react'

import { useTrack, useCollection } from '@audius/common/api'
import { ID } from '@audius/common/models'
import { formatCount, pluralize } from '@audius/common/utils'
import { IconHeart, PlainButton, PlainButtonProps } from '@audius/harmony'
import { useDispatch } from 'react-redux'

import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListType,
  UserListEntityType
} from 'store/application/ui/userListModal/types'

const messages = {
  favorite: 'Favorite'
}

type FavoriteStatsProps = {
  id: ID
  entityType: UserListEntityType
  noText?: boolean
} & Partial<Omit<PlainButtonProps, 'iconLeft' | 'onClick' | 'id'>>

export const FavoriteStats = ({
  id,
  entityType,
  noText,
  ...props
}: FavoriteStatsProps) => {
  const dispatch = useDispatch()

  const { data: collectionSaveCount } = useCollection(id, {
    enabled: entityType === UserListEntityType.COLLECTION,
    select: (collection) => {
      return collection?.save_count
    }
  })
  const { data: trackSaveCount } = useTrack(id, {
    enabled: entityType === UserListEntityType.TRACK,
    select: (track) => {
      return track?.save_count
    }
  })
  const favoriteCount = collectionSaveCount ?? trackSaveCount ?? 0

  const handleClick = useCallback(() => {
    dispatch(
      setUsers({
        userListType: UserListType.FAVORITE,
        entityType,
        id
      })
    )
    dispatch(setVisibility(true))
  }, [dispatch, entityType, id])

  if (!favoriteCount) return null

  return (
    <PlainButton
      variant='subdued'
      iconLeft={IconHeart}
      onClick={handleClick}
      {...props}
    >
      {noText
        ? formatCount(favoriteCount)
        : `${formatCount(favoriteCount)} ${pluralize(
            messages.favorite,
            favoriteCount
          )}`}
    </PlainButton>
  )
}
