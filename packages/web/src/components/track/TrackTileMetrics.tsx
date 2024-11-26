import { useCallback } from 'react'

import { useGetTrackById } from '@audius/common/api'
import { ID, Name } from '@audius/common/models'
import { repostsUserListActions, RepostType } from '@audius/common/store'
import { formatCount, route } from '@audius/common/utils'
import { IconMessage, Text, Flex, IconRepost, IconHeart } from '@audius/harmony'
import { push } from 'connected-react-router'
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
import { pluralize } from 'utils/stringUtils'

const { REPOSTING_USERS_ROUTE, FAVORITING_USERS_ROUTE } = route
const { setRepost } = repostsUserListActions

type RepostsMetricProps = {
  trackId: ID
  size?: TrackTileSize
}

export const RepostsMetric = (props: RepostsMetricProps) => {
  const { trackId, size } = props
  const { data: track } = useGetTrackById(
    { id: trackId },
    { disabled: !trackId }
  )
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

  if (!track) return null
  const { repost_count = 0, followee_reposts = [] } = track

  if (repost_count === 0) return null

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
  trackId: ID
}

export const SavesMetric = (props: SavesMetricProps) => {
  const { trackId } = props
  const { data: track } = useGetTrackById(
    { id: trackId },
    { disabled: !trackId }
  )
  const isMobile = useIsMobile()
  const dispatch = useDispatch()

  const handleClick = useCallback(() => {
    if (isMobile) {
      dispatch(setRepost(trackId, RepostType.TRACK))
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

  if (!track) return null
  const { save_count = 0 } = track

  if (save_count === 0) return null

  return (
    <VanityMetric onClick={handleClick}>
      <IconHeart size='s' color='subdued' />
      {formatCount(save_count)}
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
  const { data: track } = useGetTrackById(
    { id: trackId },
    { disabled: !trackId }
  )

  const handleClick = useCallback(() => {
    trackEvent(
      make({
        eventName: Name.COMMENTS_CLICK_COMMENT_STAT,
        trackId,
        source: 'lineup'
      })
    )
  }, [trackId])

  if (!track) return null
  const { comment_count = 0, permalink, comments_disabled } = track
  if (comments_disabled) return null

  const url = isMobile
    ? `${permalink}/comments`
    : `${permalink}?showComments=true`
  const isSmall = size === TrackTileSize.SMALL

  return (
    <VanityMetric ellipses to={url} onClick={handleClick}>
      <IconMessage size='s' color='subdued' />
      {comment_count > 0 || isSmall
        ? formatCount(comment_count)
        : 'Leave a comment'}
    </VanityMetric>
  )
}

type PlayMetricProps = {
  trackId: ID
}

export const PlayMetric = (props: PlayMetricProps) => {
  const { trackId } = props
  const { data: track } = useGetTrackById(
    { id: trackId },
    { disabled: !trackId }
  )
  if (!track) return null
  const { play_count } = track
  if (play_count === 0) return null

  return <VanityMetric disabled>{formatCount(play_count)} Plays</VanityMetric>
}
