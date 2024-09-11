import { useProxySelector } from '@audius/common/hooks'
import { trackPageSelectors, reachabilitySelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { Text } from '@audius/harmony-native'
import { Screen, ScreenContent, ScrollView } from 'app/components/core'
import { useRoute } from 'app/hooks/useRoute'

import { TrackScreenMainContent } from './TrackScreenMainContent'
import { TrackScreenSkeleton } from './TrackScreenSkeleton'
const { getLineup, getRemixParentTrack, getTrack, getUser } = trackPageSelectors
const { getIsReachable } = reachabilitySelectors

const messages = {
  moreBy: 'More By',
  originalTrack: 'Original Track',
  viewOtherRemixes: 'View Other Remixes'
}

/**
 * `TrackScreen` displays a single track and a Lineup of more tracks by the artist
 */
export const TrackScreen = () => {
  // const navigation = useNavigation()
  const { params } = useRoute<'Track'>()
  const isReachable = useSelector(getIsReachable)

  const { searchTrack } = params ?? {}

  const cachedTrack = useSelector((state) => getTrack(state, params))

  const track = cachedTrack?.track_id ? cachedTrack : searchTrack

  const cachedUser = useSelector((state) =>
    getUser(state, { id: track?.owner_id })
  )

  const user = cachedUser ?? searchTrack?.user

  const lineup = useSelector(getLineup)

  const remixParentTrack = useProxySelector(getRemixParentTrack, [])

  // const handleFetchTrack = useCallback(() => {
  //   dispatch(tracksActions.reset())
  //   dispatch(
  //     fetchTrack(
  //       id ?? null,
  //       decodeURIComponent(slug ?? ''),
  //       handle ?? user?.handle,
  //       canBeUnlisted
  //     )
  //   )
  // }, [dispatch, canBeUnlisted, id, slug, handle, user?.handle])

  // useFocusEffect(handleFetchTrack)

  if (!track || !user) {
    return <TrackScreenSkeleton />
  }

  // const handlePressGoToRemixes = () => {
  //   if (!remixParentTrack) {
  //     return
  //   }
  //   navigation.push('TrackRemixes', { id: remixParentTrack.track_id })
  // }

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

  return (
    <Screen url={track?.permalink}>
      <ScreenContent isOfflineCapable>
        {/* {isReady ? (
          <Lineup
            actions={tracksActions}
            keyboardShouldPersistTaps='handled'
            // When offline, we don't want to render any tiles here and the
            // current solution is to hard-code a count to show skeletons
            count={isReachable ? 6 : 0}
            header={
              <TrackScreenMainContent
                // @ts-ignore not sure why but it's registering
                //  as LineupState<{ id: number }> instead of Track
                lineup={lineup}
                remixParentTrack={remixParentTrack}
                track={track}
                user={user}
                lineupHeader={
                  hasValidRemixParent ? originalTrackTitle : moreByArtistTitle
                }
              />
            }
            leadingElementId={remixParentTrack?.track_id}
            leadingElementDelineator={
              <>
                <View style={styles.buttonContainer}>
                  <Button
                    iconRight={IconArrowRight}
                    variant='primary'
                    size='small'
                    onPress={handlePressGoToRemixes}
                    fullWidth
                  >
                    {messages.viewOtherRemixes}
                  </Button>
                </View>
                {moreByArtistTitle}
              </>
            }
            lineup={lineup}
            start={1}
            includeLineupStatus
          />
        ) : ( */}
        <ScrollView>
          <TrackScreenMainContent
            // @ts-ignore not sure why but it's registering
            //  as LineupState<{ id: number }> instead of Track
            lineup={lineup}
            remixParentTrack={remixParentTrack}
            track={track}
            user={user}
            lineupHeader={
              hasValidRemixParent ? originalTrackTitle : moreByArtistTitle
            }
          />
        </ScrollView>
        {/* )} */}
      </ScreenContent>
    </Screen>
  )
}
