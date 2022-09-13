import { useEffect } from 'react'

import {
  lineupSelectors,
  trackPageLineupActions,
  trackPageActions,
  trackPageSelectors
} from '@audius/common'
import { Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconArrow from 'app/assets/images/iconArrow.svg'
import { Button, Screen } from 'app/components/core'
import { Lineup } from 'app/components/lineup'
import { useNavigation } from 'app/hooks/useNavigation'
import { useRoute } from 'app/hooks/useRoute'
import { makeStyles } from 'app/styles'

import { TrackScreenMainContent } from './TrackScreenMainContent'
const { fetchTrack } = trackPageActions
const { tracksActions } = trackPageLineupActions
const { getLineup, getRemixParentTrack, getTrack, getUser } = trackPageSelectors
const { makeGetLineupMetadatas } = lineupSelectors

const getMoreByArtistLineup = makeGetLineupMetadatas(getLineup)

const messages = {
  moreBy: 'More By',
  originalTrack: 'Original Track',
  viewOtherRemixes: 'View Other Remixes'
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  lineupHeader: {
    width: '100%',
    textAlign: 'center',
    ...typography.h3,
    color: palette.neutralLight3,
    textTransform: 'uppercase'
  },
  buttonContainer: {
    padding: spacing(6)
  },
  button: {
    backgroundColor: palette.secondary
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

  // params is incorrectly typed and can sometimes be undefined
  const { searchTrack, id } = params ?? {}

  useEffect(() => {
    dispatch(fetchTrack(id, undefined, undefined, true))
  }, [dispatch, id])

  const cachedTrack = useSelector((state) => getTrack(state, params))

  const track = cachedTrack ?? searchTrack

  const cachedUser = useSelector((state) =>
    getUser(state, { id: track?.owner_id })
  )

  const user = cachedUser ?? searchTrack?.user

  const lineup = useSelector(getMoreByArtistLineup)
  const remixParentTrack = useSelector(getRemixParentTrack)

  if (!track || !user) {
    console.warn(
      'Track, user, or lineup missing for TrackScreen, preventing render'
    )
    return null
  }

  const handlePressGoToRemixes = () => {
    if (!remixParentTrack) {
      return
    }
    navigation.push('TrackRemixes', { id: remixParentTrack.track_id })
  }

  const remixParentTrackId = track.remix_of?.tracks?.[0]?.parent_track_id
  const showMoreByArtistTitle =
    (remixParentTrackId && lineup.entries.length > 2) ||
    (!remixParentTrackId && lineup.entries.length > 1)

  const hasValidRemixParent =
    !!remixParentTrackId &&
    !!remixParentTrack &&
    remixParentTrack.is_delete === false &&
    !remixParentTrack.user?.is_deactivated

  const moreByArtistTitle = showMoreByArtistTitle ? (
    <Text
      style={styles.lineupHeader}
    >{`${messages.moreBy} ${user?.name}`}</Text>
  ) : null

  const originalTrackTitle = (
    <Text style={styles.lineupHeader}>{messages.originalTrack}</Text>
  )

  return (
    <Screen>
      <Lineup
        actions={tracksActions}
        count={6}
        header={
          <TrackScreenMainContent
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
                title={messages.viewOtherRemixes}
                icon={IconArrow}
                variant='primary'
                size='small'
                onPress={handlePressGoToRemixes}
                fullWidth
                styles={{
                  root: styles.button
                }}
              />
            </View>
            {moreByArtistTitle}
          </>
        }
        lineup={lineup}
        start={1}
        includeLineupStatus
        selfLoad
      />
    </Screen>
  )
}
