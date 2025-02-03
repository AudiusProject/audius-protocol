import { useCallback } from 'react'

import { ID } from '@audius/common/models'
import {
  cacheCollectionsSelectors,
  cacheTracksSelectors
} from '@audius/common/store'
import { formatCount, pluralize } from '@audius/common/utils'
import { IconRepost, PlainButton, PlainButtonProps } from '@audius/harmony'
import { useDispatch, useSelector } from 'react-redux'

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
  repost: 'Repost'
}

type RepostStatsProps = {
  id: ID
  entityType: UserListEntityType
  noText?: boolean
} & Partial<Omit<PlainButtonProps, 'iconLeft' | 'onClick' | 'id'>>

export const RepostStats = ({
  id,
  entityType,
  noText,
  ...props
}: RepostStatsProps) => {
  const dispatch = useDispatch()

  const repostCount = useSelector((state: AppState) => {
    if (entityType === UserListEntityType.COLLECTION) {
      return getCollection(state, { id })?.repost_count ?? 0
    }
    if (entityType === UserListEntityType.TRACK) {
      return getTrack(state, { id })?.repost_count ?? 0
    }
    return 0
  })

  const handleClick = useCallback(() => {
    dispatch(
      setUsers({
        userListType: UserListType.REPOST,
        entityType,
        id
      })
    )
    dispatch(setVisibility(true))
  }, [dispatch, entityType, id])

  if (!repostCount) return null

  return (
    <PlainButton
      variant='subdued'
      iconLeft={IconRepost}
      onClick={handleClick}
      {...props}
    >
      {noText
        ? formatCount(repostCount)
        : `${formatCount(repostCount)} ${pluralize(
            messages.repost,
            repostCount
          )}`}
    </PlainButton>
  )
}
