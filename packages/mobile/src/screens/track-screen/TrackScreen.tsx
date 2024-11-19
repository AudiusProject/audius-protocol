import { useEffect } from 'react'

import { useFeatureFlag, useProxySelector } from '@audius/common/hooks'
import { trackPageMessages } from '@audius/common/messages'
import { Status } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  trackPageLineupActions,
  trackPageActions,
  trackPageSelectors,
  reachabilitySelectors
} from '@audius/common/store'
import { useDispatch, useSelector } from 'react-redux'

import { IconArrowRight, Button, Text, Flex } from '@audius/harmony-native'
import { CommentPreview } from 'app/components/comments/CommentPreview'
import {
  Screen,
  ScreenContent,
  VirtualizedScrollView
} from 'app/components/core'
import { ScreenPrimaryContent } from 'app/components/core/Screen/ScreenPrimaryContent'
import { ScreenSecondaryContent } from 'app/components/core/Screen/ScreenSecondaryContent'
import { useIsScreenReady } from 'app/components/core/Screen/hooks/useIsScreenReady'
import { Lineup } from 'app/components/lineup'
import { useNavigation } from 'app/hooks/useNavigation'
import { useRoute } from 'app/hooks/useRoute'

import { TrackScreenDetailsTile } from './TrackScreenDetailsTile'
import { TrackScreenRemixes } from './TrackScreenRemixes'
import { TrackScreenSkeleton } from './TrackScreenSkeleton'
const { fetchTrack } = trackPageActions
const { tracksActions } = trackPageLineupActions
const { getLineup, getRemixParentTrack, getTrack, getUser } = trackPageSelectors
const { getIsReachable } = reachabilitySelectors

const messages = {
  moreBy: 'More By',
  originalTrack: 'Original Track',
  ...trackPageMessages
}

const MAX_RELATED_TRACKS_TO_DISPLAY = 6

export const TrackScreen = () => {
  const navigation = useNavigation()
  const { params } = useRoute<'Track'>()
  const dispatch = useDispatch()
  const isReachable = useSelector(getIsReachable)

  const { searchTrack, id, canBeUnlisted = true, handle, slug } = params ?? {}

  const cachedTrack = useSelector((state) => getTrack(state, params))

  const track = cachedTrack?.track_id ? cachedTrack : searchTrack

  const cachedUser = useSelector((state) =>
    getUser(state, { id: track?.owner_id })
  )

  const user = cachedUser ?? searchTrack?.user

  const lineup = useSelector(getLineup)

  const remixParentTrack = useProxySelector(getRemixParentTrack, [])

  const { isEnabled: isCommentingEnabled } = useFeatureFlag(
    FeatureFlags.COMMENTS_ENABLED
  )

  const isScreenReady = useIsScreenReady()
  useEffect(() => {
    if (isScreenReady) {
      dispatch(tracksActions.reset())
      dispatch(
        fetchTrack(
          id ?? null,
          decodeURIComponent(slug ?? ''),
          handle ?? user?.handle,
          canBeUnlisted
        )
      )
    }
  }, [dispatch, canBeUnlisted, id, slug, handle, user?.handle, isScreenReady])

  if (!track || !user) {
    return <TrackScreenSkeleton />
  }

  const handlePressGoToOtherRemixes = () => {
    if (!remixParentTrack) {
      return
    }
    navigation.push('TrackRemixes', { id: remixParentTrack.track_id })
  }

  const {
    track_id,
    permalink,
    field_visibility,
    remix_of,
    _remixes,
    comments_disabled
  } = track

  const remixParentTrackId = remix_of?.tracks?.[0]?.parent_track_id

  const showMoreByArtistTitle =
    isReachable &&
    ((remixParentTrackId && lineup.entries.length > 2) ||
      (!remixParentTrackId && lineup.entries.length > 1))

  const hasValidRemixParent =
    !!remixParentTrackId &&
    !!remixParentTrack &&
    remixParentTrack.is_delete === false &&
    !remixParentTrack.user?.is_deactivated

  const hasRemixes =
    field_visibility?.remixes && _remixes && _remixes.length > 0

  const moreByArtistTitle = showMoreByArtistTitle ? (
    <Text variant='title' size='l'>
      {`${messages.moreBy} ${user?.name}`}
    </Text>
  ) : null

  const originalTrackTitle = (
    <Text variant='title' size='l'>
      {messages.originalTrack}
    </Text>
  )

  return (
    <Screen url={permalink}>
      <ScreenContent isOfflineCapable>
        <VirtualizedScrollView>
          <Flex p='m' gap='2xl'>
            {/* Track Details */}
            <ScreenPrimaryContent skeleton={<TrackScreenSkeleton />}>
              <TrackScreenDetailsTile
                track={track}
                user={user}
                uid={lineup?.entries?.[0]?.uid}
                isLineupLoading={!lineup?.entries?.[0]}
              />
            </ScreenPrimaryContent>
          </Flex>
        </VirtualizedScrollView>
      </ScreenContent>
    </Screen>
  )
}
