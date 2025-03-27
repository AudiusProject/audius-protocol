import { useCallback } from 'react'

import { useCollection } from '@audius/common/api'
import { FavoriteType, ID } from '@audius/common/models'
import {
  favoritesUserListActions,
  repostsUserListActions,
  RepostType
} from '@audius/common/store'
import { formatCount, route, pluralize } from '@audius/common/utils'
import { Text, Flex, IconRepost, IconHeart } from '@audius/harmony'
import { pick } from 'lodash'
import { useDispatch } from 'react-redux'

import { AvatarList } from 'components/avatar'
import { UserName, VanityMetric } from 'components/entity/VanityMetrics'
import { TrackTileSize } from 'components/track/types'
import { useIsMobile } from 'hooks/useIsMobile'
import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListEntityType,
  UserListType
} from 'store/application/ui/userListModal/types'
import { push } from 'utils/navigation'

const { REPOSTING_USERS_ROUTE, FAVORITING_USERS_ROUTE } = route

const { setFavorite } = favoritesUserListActions
const { setRepost } = repostsUserListActions

type RepostsMetricProps = {
  collectionId: ID
  size?: TrackTileSize
}

export const RepostsMetric = (props: RepostsMetricProps) => {
  const { collectionId, size } = props
  const { data: partialCollection } = useCollection(collectionId, {
    select: (collection) =>
      pick(collection, 'repost_count', 'followee_reposts', 'is_album')
  })
  const { repost_count, followee_reposts, is_album } = partialCollection ?? {}

  const isMobile = useIsMobile()
  const dispatch = useDispatch()

  const handleClick = useCallback(() => {
    if (isMobile) {
      dispatch(setRepost(collectionId, RepostType.COLLECTION))
      dispatch(push(REPOSTING_USERS_ROUTE))
    } else {
      dispatch(
        setUsers({
          userListType: UserListType.REPOST,
          entityType: UserListEntityType.COLLECTION,
          id: collectionId
        })
      )
      dispatch(setVisibility(true))
    }
  }, [dispatch, isMobile, collectionId])

  if (repost_count === undefined || followee_reposts === undefined) return null

  if (repost_count === 0)
    return (
      <VanityMetric disabled>
        <IconRepost size='s' color='subdued' />
        <Text>
          Be the first to repost this {is_album ? 'album' : 'playlist'}
        </Text>
      </VanityMetric>
    )

  const renderName = () => {
    const [{ user_id }] = followee_reposts

    const remainingCount = repost_count - 1
    const remainingText =
      remainingCount > 0
        ? ` + ${formatCount(remainingCount)} ${pluralize(
            'Repost',
            remainingCount
          )}`
        : ' Reposted'

    return (
      <Text>
        <UserName userId={user_id} />
        {remainingText}
      </Text>
    )
  }

  const isLargeSize = size === TrackTileSize.LARGE && !isMobile

  return (
    <VanityMetric onClick={handleClick}>
      {isLargeSize && followee_reposts.length >= 3 ? (
        <AvatarList users={followee_reposts.map(({ user_id }) => user_id)} />
      ) : null}
      <Flex gap='xs'>
        <IconRepost size='s' color='subdued' />
        {isLargeSize && followee_reposts.length > 0
          ? renderName()
          : formatCount(repost_count)}
      </Flex>
    </VanityMetric>
  )
}

type SavesMetricProps = {
  collectionId: ID
}

export const SavesMetric = (props: SavesMetricProps) => {
  const { collectionId } = props
  const { data: save_count } = useCollection(collectionId, {
    select: (collection) => collection.save_count
  })

  const isMobile = useIsMobile()
  const dispatch = useDispatch()

  const handleClick = useCallback(() => {
    if (isMobile) {
      dispatch(setFavorite(collectionId, FavoriteType.PLAYLIST))
      dispatch(push(FAVORITING_USERS_ROUTE))
    } else {
      dispatch(
        setUsers({
          userListType: UserListType.FAVORITE,
          entityType: UserListEntityType.COLLECTION,
          id: collectionId
        })
      )
      dispatch(setVisibility(true))
    }
  }, [dispatch, isMobile, collectionId])

  if (save_count === undefined) return null

  return (
    <VanityMetric onClick={handleClick}>
      <IconHeart size='s' color='subdued' />
      {formatCount(save_count)}
    </VanityMetric>
  )
}
