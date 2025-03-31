import { useCallback } from 'react'

import { useCollection, useTrack } from '@audius/common/api'
import { ID } from '@audius/common/models'
import { formatCount, pluralize } from '@audius/common/utils'
import { IconRepost, PlainButton, PlainButtonProps } from '@audius/harmony'
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

  const { data: collectionRepostCount } = useCollection(id, {
    enabled: entityType === UserListEntityType.COLLECTION,
    select: (collection) => {
      return collection?.repost_count
    }
  })
  const { data: trackRepostCount } = useTrack(id, {
    enabled: entityType === UserListEntityType.TRACK,
    select: (track) => {
      return track?.repost_count
    }
  })
  const repostCount = collectionRepostCount ?? trackRepostCount ?? 0

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
