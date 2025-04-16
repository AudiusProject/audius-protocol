import { useEffect, useRef } from 'react'

import { useTrackByParams, useUser } from '@audius/common/api'
import {
  trackPageLineupActions,
  trackPageSelectors,
  reachabilitySelectors
} from '@audius/common/store'
import type { FlatList } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { Flex } from '@audius/harmony-native'
import { CommentPreview } from 'app/components/comments/CommentPreview'
import {
  Screen,
  ScreenContent,
  VirtualizedScrollView
} from 'app/components/core'
import { ScreenPrimaryContent } from 'app/components/core/Screen/ScreenPrimaryContent'
import { ScreenSecondaryContent } from 'app/components/core/Screen/ScreenSecondaryContent'
import { useIsScreenReady } from 'app/components/core/Screen/hooks/useIsScreenReady'
import { useRoute } from 'app/hooks/useRoute'

import { TrackScreenDetailsTile } from './TrackScreenDetailsTile'
import { TrackScreenLineup } from './TrackScreenLineup'
import { TrackScreenSkeleton } from './TrackScreenSkeleton'

const { tracksActions } = trackPageLineupActions
const { getLineup } = trackPageSelectors
const { getIsReachable } = reachabilitySelectors

export const TrackScreen = () => {
  const { params } = useRoute<'Track'>()
  const dispatch = useDispatch()
  const isReachable = useSelector(getIsReachable)
  const scrollViewRef = useRef<FlatList>(null)

  const { searchTrack, ...restParams } = params ?? {}
  const { data: fetchedTrack } = useTrackByParams(restParams)
  const track = fetchedTrack ?? searchTrack

  const { data: user } = useUser(track?.owner_id)

  const lineup = useSelector(getLineup)

  const isScreenReady = useIsScreenReady()

  useEffect(() => {
    if (isScreenReady) {
      dispatch(tracksActions.reset())
    }
  }, [dispatch, isScreenReady])

  if (!track || !user) {
    return (
      <Flex p='l' gap='2xl'>
        <TrackScreenSkeleton />
      </Flex>
    )
  }

  const { track_id, permalink, comments_disabled } = track

  return (
    <Screen url={permalink}>
      <ScreenContent isOfflineCapable>
        <VirtualizedScrollView ref={scrollViewRef}>
          <Flex p='l' gap='2xl'>
            {/* Track Details */}
            <ScreenPrimaryContent skeleton={<TrackScreenSkeleton />}>
              <TrackScreenDetailsTile
                track={track}
                user={user}
                uid={lineup?.entries?.[0]?.uid}
                isLineupLoading={!lineup?.entries?.[0]}
                scrollViewRef={scrollViewRef}
              />
            </ScreenPrimaryContent>

            {isReachable ? (
              <ScreenSecondaryContent>
                <Flex gap='2xl'>
                  {/* Comments */}
                  {!comments_disabled ? (
                    <Flex flex={3}>
                      <CommentPreview entityId={track_id} />
                    </Flex>
                  ) : null}
                  <TrackScreenLineup trackId={track_id} user={user} />
                </Flex>
              </ScreenSecondaryContent>
            ) : null}
          </Flex>
        </VirtualizedScrollView>
      </ScreenContent>
    </Screen>
  )
}
