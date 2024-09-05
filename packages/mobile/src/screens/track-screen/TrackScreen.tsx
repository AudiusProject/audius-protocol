import { useCallback, useEffect } from 'react'

import { useFeatureFlag, useProxySelector } from '@audius/common/hooks'
import { FeatureFlags } from '@audius/common/services'
import {
  trackPageLineupActions,
  trackPageActions,
  trackPageSelectors,
  reachabilitySelectors,
  lineupSelectors,
  remixesPageLineupActions
} from '@audius/common/store'
import { useFocusEffect } from '@react-navigation/native'
import { ScrollView, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { IconArrowRight, Button, Text, Flex } from '@audius/harmony-native'
import { CommentSection } from 'app/components/comments/CommentSection'
import { Screen, ScreenContent } from 'app/components/core'
import { Lineup } from 'app/components/lineup'
import { useNavigation } from 'app/hooks/useNavigation'
import { useRoute } from 'app/hooks/useRoute'
import { makeStyles } from 'app/styles'

import { TrackScreenDetailsTile } from './TrackScreenDetailsTile'
import { TrackScreenSkeleton } from './TrackScreenSkeleton'
const { fetchTrack } = trackPageActions
const { tracksActions } = trackPageLineupActions
const { getLineup, getRemixParentTrack, getTrack, getUser } = trackPageSelectors
const { getIsReachable } = reachabilitySelectors

const { makeGetLineupMetadatas } = lineupSelectors

const getRemixesTracksLineup = makeGetLineupMetadatas(getLineup)

const messages = {
  moreBy: 'More By',
  originalTrack: 'Original Track',
  viewOtherRemixes: 'View Other Remixes',
  viewAllRemixes: 'View All Remixes',
  remixes: 'Remixes Of This Track'
}

const MAX_REMIXES_TO_DISPLAY = 6
const MAX_RELATED_TRACKS_TO_DISPLAY = 6

const useStyles = makeStyles(({ spacing }) => ({
  buttonContainer: {
    padding: spacing(6)
  }
}))

/**
 * `TrackScreen` displays a single track and a Lineup of more tracks by the artist
 */
export const TrackScreen = () => {
  const styles = useStyles()
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
    <Text variant='title' size='l'>
      {messages.originalTrack}
    </Text>
  )

  const { track_id, field_visibility, _remixes, comments_disabled } = track

  const remixTrackIds = _remixes?.map(({ track_id }) => track_id) ?? null

  return (
    <Screen url={track?.permalink}>
      <ScreenContent isOfflineCapable>
        <ScrollView>
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
          </Flex>

          {/* Remixes */}
          {field_visibility?.remixes &&
            remixTrackIds &&
            remixTrackIds.length > 0 && (
              <>
                <Flex ph='m'>
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
                />
                {/* {remixTrackIds.length > MAX_REMIXES_TO_DISPLAY ? ( */}
                <Flex ph='m'>
                  <Button
                    iconRight={IconArrowRight}
                    size='small'
                    onPress={handlePressGoToAllRemixes}
                  >
                    {messages.viewAllRemixes}
                  </Button>
                </Flex>
                {/* ) : null} */}
              </>
            )}

          {/* More by Artist / Remix Parent */}
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
          />

          {hasValidRemixParent ? (
            <>
              <View style={styles.buttonContainer}>
                <Button
                  iconRight={IconArrowRight}
                  variant='primary'
                  size='small'
                  onPress={handlePressGoToOtherRemixes}
                  fullWidth
                >
                  {messages.viewOtherRemixes}
                </Button>
              </View>
            </>
          ) : null}
        </ScrollView>
      </ScreenContent>
    </Screen>
  )
}
