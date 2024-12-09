import { useCallback } from 'react'

import { FavoriteType, ID } from '@audius/common/models'
import {
  cacheCollectionsSelectors,
  favoritesUserListActions,
  repostsUserListActions,
  RepostType
} from '@audius/common/store'
import { formatCount, route } from '@audius/common/utils'
import { Text, Flex, IconRepost, IconHeart } from '@audius/harmony'
import { push } from 'connected-react-router'
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
import { useSelector } from 'utils/reducer'
import { pluralize } from 'utils/stringUtils'

const { REPOSTING_USERS_ROUTE, FAVORITING_USERS_ROUTE } = route

const { setFavorite } = favoritesUserListActions
const { setRepost } = repostsUserListActions

const { getCollection } = cacheCollectionsSelectors

type RepostsMetricProps = {
  collectionId: ID
  size?: TrackTileSize
}

export const RepostsMetric = (props: RepostsMetricProps) => {
  const { collectionId, size } = props
  const repostCount = useSelector((state) => {
    return getCollection(state, { id: collectionId })?.repost_count
  })

  const followeeReposts = useSelector((state) => {
    return getCollection(state, { id: collectionId })?.followee_reposts
  })

  const isAlbum = useSelector((state) => {
    return getCollection(state, { id: collectionId })?.is_album
  })

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

  if (repostCount === undefined || followeeReposts === undefined) return null

  if (repostCount === 0)
    return (
      <VanityMetric disabled>
        <IconRepost size='s' color='subdued' />
        <Text>
          Be the first to repost this {isAlbum ? 'album' : 'playlist'}
        </Text>
      </VanityMetric>
    )

  const renderName = () => {
    const [{ user_id }] = followeeReposts

    const remainingCount = repostCount - 1
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
      {isLargeSize && followeeReposts.length >= 3 ? (
        <AvatarList users={followeeReposts.map(({ user_id }) => user_id)} />
      ) : null}
      <Flex gap='xs'>
        <IconRepost size='s' color='subdued' />
        {isLargeSize && followeeReposts.length > 0
          ? renderName()
          : formatCount(repostCount)}
      </Flex>
    </VanityMetric>
  )
}

type SavesMetricProps = {
  collectionId: ID
}

export const SavesMetric = (props: SavesMetricProps) => {
  const { collectionId } = props
  const saveCount = useSelector((state) => {
    return getCollection(state, { id: collectionId })?.save_count
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

  if (!saveCount) return null

  return (
    <VanityMetric onClick={handleClick}>
      <IconHeart size='s' color='subdued' />
      {formatCount(saveCount)}
    </VanityMetric>
  )
}
