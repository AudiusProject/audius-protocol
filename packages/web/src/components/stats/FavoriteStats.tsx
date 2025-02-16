import { useCallback } from 'react'

import { ID } from '@audius/common/models'
import {
  cacheCollectionsSelectors,
  cacheTracksSelectors
} from '@audius/common/store'
import { formatCount, pluralize } from '@audius/common/utils'
import { IconHeart, PlainButton, PlainButtonProps } from '@audius/harmony'
import { useDispatch, useSelector } from 'react-redux'

import { componentWithErrorBoundary } from 'components/error-wrapper/componentWithErrorBoundary'
import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListType,
  UserListEntityType
} from 'store/application/ui/userListModal/types'
import { AppState } from 'store/types'

const { getCollection } = cacheCollectionsSelectors
const { getTrack } = cacheTracksSelectors

const messages = {
  favorite: 'Favorite'
}

type FavoriteStatsProps = {
  id: ID
  entityType: UserListEntityType
  noText?: boolean
} & Partial<Omit<PlainButtonProps, 'iconLeft' | 'onClick' | 'id'>>

const FavoriteStatsContent = ({
  id,
  entityType,
  noText,
  ...props
}: FavoriteStatsProps) => {
  const dispatch = useDispatch()

  const favoriteCount = useSelector((state: AppState) => {
    if (entityType === UserListEntityType.COLLECTION) {
      return getCollection(state, { id })?.save_count ?? 0
    }
    if (entityType === UserListEntityType.TRACK) {
      return getTrack(state, { id })?.save_count ?? 0
    }
    return 0
  })

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

export const FavoriteStats = componentWithErrorBoundary(FavoriteStatsContent, {
  name: 'FavoriteStats'
})
