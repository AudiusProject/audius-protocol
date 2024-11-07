import { useCallback } from 'react'

import { useGetPlaylistById } from '@audius/common/api'
import { ID } from '@audius/common/models'
import { repostsUserListActions, RepostType } from '@audius/common/store'
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
import { pluralize } from 'utils/stringUtils'

const { REPOSTING_USERS_ROUTE, FAVORITING_USERS_ROUTE } = route
const { setRepost } = repostsUserListActions

type RepostsMetricProps = {
  collectionId: ID
  size?: TrackTileSize
}

export const RepostsMetric = (props: RepostsMetricProps) => {
  const { collectionId, size } = props
  const { data: playlist } = useGetPlaylistById(
    { playlistId: collectionId },
    { disabled: !collectionId }
  )
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

  if (!playlist) return null
  const { repost_count = 0, followee_reposts = [], is_album } = playlist

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
    <VanityMetric
      css={(theme) => ({ gap: theme.spacing.l })}
      onClick={handleClick}
    >
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
  const { data: playlist } = useGetPlaylistById(
    { playlistId: collectionId },
    { disabled: !collectionId }
  )
  const isMobile = useIsMobile()
  const dispatch = useDispatch()

  const handleClick = useCallback(() => {
    if (isMobile) {
      dispatch(setRepost(collectionId, RepostType.COLLECTION))
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

  if (!playlist) return null
  const { save_count = 0 } = playlist

  if (save_count === 0) return null

  return (
    <VanityMetric onClick={handleClick}>
      <IconHeart size='s' color='subdued' />
      {formatCount(save_count)}
    </VanityMetric>
  )
}
