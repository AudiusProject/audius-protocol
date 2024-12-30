import { useCallback } from 'react'

import { FavoriteType, ID, Name } from '@audius/common/models'
import {
  cacheTracksSelectors,
  favoritesUserListActions,
  repostsUserListActions,
  RepostType
} from '@audius/common/store'
import { formatCount, route, pluralize } from '@audius/common/utils'
import { IconMessage, Text, Flex, IconRepost, IconHeart } from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { AvatarList } from 'components/avatar'
import { UserName, VanityMetric } from 'components/entity/VanityMetrics'
import { TrackTileSize } from 'components/track/types'
import { useIsMobile } from 'hooks/useIsMobile'
import { make, track as trackEvent } from 'services/analytics'
import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListEntityType,
  UserListType
} from 'store/application/ui/userListModal/types'
import { push } from 'utils/navigation'
import { useSelector } from 'utils/reducer'

const { REPOSTING_USERS_ROUTE, FAVORITING_USERS_ROUTE } = route

const { setFavorite } = favoritesUserListActions
const { setRepost } = repostsUserListActions
const { getTrack } = cacheTracksSelectors

type RepostsMetricProps = {
  trackId: ID
  size?: TrackTileSize
}

export const RepostsMetric = (props: RepostsMetricProps) => {
  const { trackId, size } = props

  const repostCount = useSelector((state) => {
    return getTrack(state, { id: trackId })?.repost_count
  })
  const followeeReposts = useSelector((state) => {
    return getTrack(state, { id: trackId })?.followee_reposts
  })

  const isMobile = useIsMobile()
  const dispatch = useDispatch()

  const handleClick = useCallback(() => {
    if (isMobile) {
      dispatch(setRepost(trackId, RepostType.TRACK))
      dispatch(push(REPOSTING_USERS_ROUTE))
    } else {
      dispatch(
        setUsers({
          userListType: UserListType.REPOST,
          entityType: UserListEntityType.TRACK,
          id: trackId
        })
      )
      dispatch(setVisibility(true))
    }
  }, [dispatch, isMobile, trackId])

  if (!repostCount || followeeReposts === undefined) return null

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
  trackId: ID
}

export const SavesMetric = (props: SavesMetricProps) => {
  const { trackId } = props
  const saveCount = useSelector((state) => {
    return getTrack(state, { id: trackId })?.save_count
  })
  const isMobile = useIsMobile()
  const dispatch = useDispatch()

  const handleClick = useCallback(() => {
    if (isMobile) {
      dispatch(setFavorite(trackId, FavoriteType.TRACK))
      dispatch(push(FAVORITING_USERS_ROUTE))
    } else {
      dispatch(
        setUsers({
          userListType: UserListType.FAVORITE,
          entityType: UserListEntityType.TRACK,
          id: trackId
        })
      )
      dispatch(setVisibility(true))
    }
  }, [dispatch, isMobile, trackId])

  if (!saveCount) return null

  return (
    <VanityMetric onClick={handleClick}>
      <IconHeart size='s' color='subdued' />
      {formatCount(saveCount)}
    </VanityMetric>
  )
}

type CommentMetricProps = {
  trackId: ID
  size: TrackTileSize
}

export const CommentMetric = (props: CommentMetricProps) => {
  const { trackId, size } = props
  const isMobile = useIsMobile()
  const commentCount = useSelector((state) => {
    return getTrack(state, { id: trackId })?.comment_count ?? 0
  })

  const permalink = useSelector((state) => {
    return getTrack(state, { id: trackId })?.permalink
  })

  const commentsDisabled = useSelector((state) => {
    return getTrack(state, { id: trackId })?.comments_disabled
  })

  const handleClick = useCallback(() => {
    trackEvent(
      make({
        eventName: Name.COMMENTS_CLICK_COMMENT_STAT,
        trackId,
        source: 'lineup'
      })
    )
  }, [trackId])

  if (commentsDisabled) return null

  const url = isMobile
    ? `${permalink}/comments`
    : `${permalink}?showComments=true`
  const isSmall = size === TrackTileSize.SMALL

  return (
    <VanityMetric ellipses to={url} onClick={handleClick}>
      <IconMessage size='s' color='subdued' />
      {commentCount > 0 || isSmall
        ? formatCount(commentCount)
        : 'Leave a comment'}
    </VanityMetric>
  )
}

type PlayMetricProps = {
  trackId: ID
}

export const PlayMetric = (props: PlayMetricProps) => {
  const { trackId } = props
  const playCount = useSelector((state) => {
    return getTrack(state, { id: trackId })?.play_count ?? 0
  })

  if (!playCount) return null

  return <VanityMetric disabled>{formatCount(playCount)} Plays</VanityMetric>
}
