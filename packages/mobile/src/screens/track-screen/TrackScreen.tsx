import { useCallback, useEffect } from 'react'

import { useFeatureFlag, useProxySelector } from '@audius/common/hooks'
import { Status } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  trackPageLineupActions,
  trackPageActions,
  trackPageSelectors,
  reachabilitySelectors,
  lineupSelectors,
  remixesPageLineupActions,
  remixesPageSelectors
} from '@audius/common/store'
import { useFocusEffect } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'

import {
  IconArrowRight,
  Button,
  Text,
  Flex,
  IconRemix
} from '@audius/harmony-native'
import { CommentSection } from 'app/components/comments/CommentSection'
import {
  Screen,
  ScreenContent,
  VirtualizedScrollView
} from 'app/components/core'
import { Lineup } from 'app/components/lineup'
import { useNavigation } from 'app/hooks/useNavigation'
import { useRoute } from 'app/hooks/useRoute'

import { TrackScreenDetailsTile } from './TrackScreenDetailsTile'
import { TrackScreenSkeleton } from './TrackScreenSkeleton'
const { fetchTrack } = trackPageActions
const { tracksActions } = trackPageLineupActions
const { getLineup, getRemixParentTrack, getTrack, getUser } = trackPageSelectors
const { getLineup: getRemixesLineup } = remixesPageSelectors
const { getIsReachable } = reachabilitySelectors

const { makeGetLineupMetadatas } = lineupSelectors

const getRemixesTracksLineup = makeGetLineupMetadatas(getRemixesLineup)

const messages = {
  moreBy: 'More By',
  originalTrack: 'Original Track',
  viewOtherRemixes: 'View Other Remixes',
  viewAllRemixes: 'View All Remixes',
  remixes: 'Remixes Of This Track'
}

const MAX_REMIXES_TO_DISPLAY = 6
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

  const remixesLineup = useSelector(getRemixesTracksLineup)

  const handleFetchTrack = useCallback(() => {
    dispatch(tracksActions.reset())
    dispatch(
      fetchTrack(
        id ?? null,
        decodeURIComponent(slug ?? ''),
        handle ?? user?.handle,
        canBeUnlisted
      )
    )
  }, [dispatch, canBeUnlisted, id, slug, handle, user?.handle])

  useFocusEffect(handleFetchTrack)

  useEffect(() => {
    if (track) {
      dispatch(
        remixesPageLineupActions.fetchLineupMetadatas(0, 10, false, {
          trackId: track.track_id
        })
      )
    }

    return function cleanup() {
      dispatch(remixesPageLineupActions.reset())
    }
  }, [dispatch, track])

  if (!track || !user) {
    return <TrackScreenSkeleton />
  }

  const handlePressGoToAllRemixes = () => {
    navigation.push('TrackRemixes', { id: track_id })
  }

  const handlePressGoToOtherRemixes = () => {
    if (!remixParentTrack) {
      return
    }
    navigation.push('TrackRemixes', { id: remixParentTrack.track_id })
  }

  const remixParentTrackId = track.remix_of?.tracks?.[0]?.parent_track_id

  const showMoreByArtistTitle =
    isReachable &&
    ((remixParentTrackId && lineup.entries.length > 2) ||
      (!remixParentTrackId && lineup.entries.length > 1))

  const hasValidRemixParent =
    !!remixParentTrackId &&
    !!remixParentTrack &&
    remixParentTrack.is_delete === false &&
    !remixParentTrack.user?.is_deactivated

  const moreByArtistTitle = showMoreByArtistTitle ? (
    <Text variant='title' size='m'>
      {`${messages.moreBy} ${user?.name}`}
    </Text>
  ) : null

  const originalTrackTitle = (
    <Text variant='title' size='m'>
      {messages.originalTrack}
    </Text>
  )

  const { track_id, field_visibility, _remixes, comments_disabled } = track

  const remixTrackIds = _remixes?.map(({ track_id }) => track_id) ?? null

  return (
    <Screen url={track?.permalink}>
      <ScreenContent isOfflineCapable>
        <VirtualizedScrollView>
          <Flex p='m' gap='2xl'>
            {/* Track Details */}
            <TrackScreenDetailsTile
              track={track}
              user={user}
              uid={lineup?.entries?.[0]?.uid}
              isLineupLoading={!lineup?.entries?.[0]}
            />

            {/* Comments */}
            {isCommentingEnabled && !comments_disabled ? (
              <Flex flex={3}>
                <CommentSection entityId={track_id} />
              </Flex>
            ) : null}

            {/* Remixes */}
            {field_visibility?.remixes &&
              remixTrackIds &&
              remixTrackIds.length > 0 && (
                <Flex>
                  <Flex row alignItems='center' gap='s'>
                    <IconRemix color='default' />
                    <Text variant='title'>{messages.remixes}</Text>
                  </Flex>
                  <Lineup
                    lineup={remixesLineup}
                    actions={remixesPageLineupActions}
                    count={
                      isReachable
                        ? Math.min(MAX_REMIXES_TO_DISPLAY, remixTrackIds.length)
                        : 0
                    }
                    itemStyles={{
                      padding: 0,
                      paddingVertical: 12
                    }}
                  />
                  {remixTrackIds.length > MAX_REMIXES_TO_DISPLAY ? (
                    <Flex pt='m' alignItems='flex-start'>
                      <Button
                        iconRight={IconArrowRight}
                        size='xs'
                        onPress={handlePressGoToAllRemixes}
                      >
                        {messages.viewAllRemixes}
                      </Button>
                    </Flex>
                  ) : null}
                </Flex>
              )}

            {/* More by Artist / Remix Parent */}
            <Flex>
              {hasValidRemixParent ? originalTrackTitle : moreByArtistTitle}
              <Lineup
                actions={tracksActions}
                keyboardShouldPersistTaps='handled'
                // When offline, we don't want to render any tiles here and the
                // current solution is to hard-code a count to show skeletons
                count={isReachable ? MAX_RELATED_TRACKS_TO_DISPLAY : 0}
                lineup={lineup}
                start={1}
                includeLineupStatus
                itemStyles={{
                  padding: 0,
                  paddingVertical: 12
                }}
                leadingElementId={remixParentTrack?.track_id}
                leadingElementDelineator={
                  <Flex>
                    {lineup.status === Status.SUCCESS ? (
                      <Flex pt='m' alignItems='flex-start'>
                        <Button
                          iconRight={IconArrowRight}
                          size='xs'
                          onPress={handlePressGoToOtherRemixes}
                        >
                          {messages.viewOtherRemixes}
                        </Button>
                      </Flex>
                    ) : null}
                    <Flex mt='2xl'>{moreByArtistTitle}</Flex>
                  </Flex>
                }
              />
            </Flex>
          </Flex>
        </VirtualizedScrollView>
      </ScreenContent>
    </Screen>
  )
}
