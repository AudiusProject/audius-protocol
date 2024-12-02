import { useCallback } from 'react'

import { useFeatureFlag } from '@audius/common/hooks'
import type { ID } from '@audius/common/models'
import { FavoriteType, Name } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import type { CommonState, LineupBaseActions } from '@audius/common/store'
import {
  repostsUserListActions,
  favoritesUserListActions,
  RepostType,
  cacheTracksSelectors
} from '@audius/common/store'
import { formatCount } from '@audius/common/utils'
import { useDispatch, useSelector } from 'react-redux'

import { IconRepost, IconHeart, IconMessage } from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'
import { make, track as trackEvent } from 'app/services/analytics'

import { useCommentDrawer } from '../comments/CommentDrawerContext'

import { VanityMetric } from './VanityMetrics'

const { setFavorite } = favoritesUserListActions
const { setRepost } = repostsUserListActions
const { getTrack } = cacheTracksSelectors
type RepostsMetricProps = {
  trackId: ID
}

export const RepostsMetric = (props: RepostsMetricProps) => {
  const { trackId } = props

  const repostCount = useSelector((state: CommonState) => {
    return getTrack(state, { id: trackId })?.repost_count
  })

  const dispatch = useDispatch()
  const navigation = useNavigation()

  const handlePress = useCallback(() => {
    dispatch(setRepost(trackId, RepostType.TRACK))
    navigation.push('Reposts', {
      id: trackId,
      repostType: RepostType.TRACK
    })
  }, [trackId, dispatch, navigation])

  if (!repostCount || repostCount === 0) return null

  return (
    <VanityMetric icon={IconRepost} onPress={handlePress}>
      {formatCount(repostCount)}
    </VanityMetric>
  )
}

type SavesMetricProps = {
  trackId: ID
}

export const SavesMetric = (props: SavesMetricProps) => {
  const { trackId } = props
  const saveCount = useSelector((state: CommonState) => {
    return getTrack(state, { id: trackId })?.save_count
  })

  const dispatch = useDispatch()
  const navigation = useNavigation()

  const handlePress = useCallback(() => {
    dispatch(setFavorite(trackId, FavoriteType.TRACK))
    navigation.push('Favorited', {
      id: trackId,
      favoriteType: FavoriteType.TRACK
    })
  }, [trackId, dispatch, navigation])

  if (!saveCount || saveCount === 0) return null

  return (
    <VanityMetric icon={IconHeart} onPress={handlePress}>
      {formatCount(saveCount)}
    </VanityMetric>
  )
}

type CommentMetricProps = {
  trackId: ID
  actions?: LineupBaseActions
  uid?: string
}

export const CommentMetric = (props: CommentMetricProps) => {
  const { trackId, actions, uid } = props
  const { open } = useCommentDrawer()
  const navigation = useNavigation()
  const { isEnabled } = useFeatureFlag(FeatureFlags.COMMENTS_ENABLED)
  const commentCount = useSelector((state: CommonState) => {
    return getTrack(state, { id: trackId })?.comment_count
  })
  const commentsDisabled = useSelector((state: CommonState) => {
    return getTrack(state, { id: trackId })?.comments_disabled
  })

  const handlePress = useCallback(() => {
    open({
      entityId: trackId,
      navigation,
      autoFocusInput: false,
      uid,
      actions
    })

    trackEvent(
      make({
        eventName: Name.COMMENTS_CLICK_COMMENT_STAT,
        trackId,
        source: 'lineup'
      })
    )
  }, [open, trackId, navigation, uid, actions])

  if (!commentCount || !isEnabled || commentsDisabled) return null

  return (
    <VanityMetric icon={IconMessage} onPress={handlePress}>
      {commentCount > 0 ? formatCount(commentCount) : 'Leave a comment'}
    </VanityMetric>
  )
}

type PlayMetricProps = {
  trackId: ID
}

export const PlayMetric = (props: PlayMetricProps) => {
  const { trackId } = props
  const playCount = useSelector((state: CommonState) => {
    return getTrack(state, { id: trackId })?.play_count
  })
  if (!playCount || playCount === 0) return null

  return <VanityMetric disabled>{formatCount(playCount)} Plays</VanityMetric>
}
