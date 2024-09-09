import { useGetCurrentUserId, useGetTrackById } from '@audius/common/api'
import { useFeatureFlag } from '@audius/common/hooks'
import { ID, Track } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { formatCount } from '@audius/common/utils'
import {
  Flex,
  IconHeart as IconFavorite,
  IconMessage,
  IconPlay,
  IconRepost,
  PlainButton
} from '@audius/harmony'

import { getTrackDefaults } from 'pages/track-page/utils'

type StatsButtonRowProps = {
  id: ID
  className?: string
  onClickFavorites: () => void
  onClickReposts: () => void
}

// A row of stats, visible on playlist and tracks pages.
const StatsButtonRow = ({
  id,
  className,
  onClickFavorites,
  onClickReposts
}: StatsButtonRowProps) => {
  const { isEnabled: isCommentsEnabled } = useFeatureFlag(
    FeatureFlags.COMMENTS_ENABLED
  )

  const { data: currentUserId } = useGetCurrentUserId({})
  const track = (useGetTrackById({ id, currentUserId }).data ??
    undefined) as unknown as Track | undefined

  const {
    saveCount,
    repostCount,
    commentCount,
    isStreamGated,
    isUnlisted,
    commentsDisabled,
    ownerId,
    listenCount = 0
  } = getTrackDefaults(track ?? null)
  const isOwner = ownerId === currentUserId
  const showListenCount = isOwner || (!isStreamGated && !isUnlisted)
  const showRepostCount = !isUnlisted
  const showFavoriteCount = !isUnlisted
  const showCommentCount = !commentsDisabled && !isUnlisted

  if (
    !showListenCount &&
    !showRepostCount &&
    !showFavoriteCount &&
    !showCommentCount
  )
    return null

  const renderListenCount = () => (
    <PlainButton iconLeft={IconPlay}>{formatCount(listenCount)}</PlainButton>
  )

  const renderFavoriteCount = () => (
    <PlainButton iconLeft={IconFavorite} onClick={onClickFavorites}>
      {formatCount(saveCount)}
    </PlainButton>
  )

  const renderRepostCount = () => (
    <PlainButton onClick={onClickReposts} iconLeft={IconRepost}>
      {formatCount(repostCount)}
    </PlainButton>
  )

  const renderCommentCount = () => (
    <PlainButton iconLeft={IconMessage}>
      {formatCount(commentCount)}
    </PlainButton>
  )

  return (
    <Flex gap='xl' className={className} justifyContent='flex-start'>
      {showListenCount ? renderListenCount() : null}
      {showRepostCount ? renderRepostCount() : null}
      {showFavoriteCount ? renderFavoriteCount() : null}
      {isCommentsEnabled && showCommentCount ? renderCommentCount() : null}
    </Flex>
  )
}

export default StatsButtonRow
