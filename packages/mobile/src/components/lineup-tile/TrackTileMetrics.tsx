import { useCallback } from 'react'

import { useGetTrackById } from '@audius/common/api'
import { useFeatureFlag } from '@audius/common/hooks'
import type { ID } from '@audius/common/models'
import { FavoriteType, Name } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import type { LineupBaseActions } from '@audius/common/store'
import {
  repostsUserListActions,
  favoritesUserListActions,
  RepostType
} from '@audius/common/store'
import { formatCount } from '@audius/common/utils'
import { useDispatch } from 'react-redux'

import { IconRepost, IconHeart, IconMessage } from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'
import { make, track as trackEvent } from 'app/services/analytics'

import { useCommentDrawer } from '../comments/CommentDrawerContext'

import { VanityMetric } from './VanityMetrics'

const { setFavorite } = favoritesUserListActions
const { setRepost } = repostsUserListActions

type RepostsMetricProps = {
  trackId: ID
}

export const RepostsMetric = (props: RepostsMetricProps) => {
  const { trackId } = props
  const { data: track } = useGetTrackById(
    { id: trackId },
    { disabled: !trackId }
  )
  const dispatch = useDispatch()
  const navigation = useNavigation()

  const handlePress = useCallback(() => {
    dispatch(setRepost(trackId, RepostType.TRACK))
    navigation.push('Reposts', {
      id: trackId,
      repostType: RepostType.TRACK
    })
  }, [trackId, dispatch, navigation])

  if (!track) return null
  const { repost_count = 0 } = track

  if (repost_count === 0) return null

  return (
    <VanityMetric icon={IconRepost} onPress={handlePress}>
      {formatCount(repost_count)}
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
  const dispatch = useDispatch()
  const navigation = useNavigation()

  const handlePress = useCallback(() => {
    dispatch(setFavorite(trackId, FavoriteType.TRACK))
    navigation.push('Favorited', {
      id: trackId,
      favoriteType: FavoriteType.TRACK
    })
  }, [trackId, dispatch, navigation])

  if (!track) return null
  const { save_count = 0 } = track

  if (save_count === 0) return null

  return (
    <VanityMetric icon={IconHeart} onPress={handlePress}>
      {formatCount(save_count)}
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
  const { data: track } = useGetTrackById(
    { id: trackId },
    { disabled: !trackId }
  )

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

  if (!track || !isEnabled) return null

  const { comment_count = 0, comments_disabled } = track
  if (comments_disabled) return null

  return (
    <VanityMetric icon={IconMessage} onPress={handlePress}>
      {comment_count > 0 ? formatCount(comment_count) : 'Leave a comment'}
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
