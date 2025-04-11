import { useEffect } from 'react'

import { useRemixes, useTrackByParams } from '@audius/common/api'
import {
  remixesPageLineupActions as tracksActions,
  remixesPageActions,
  remixesPageSelectors
} from '@audius/common/store'
import { pluralize } from '@audius/common/utils'
import { Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { IconRemix } from '@audius/harmony-native'
import { Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import { Lineup } from 'app/components/lineup'
import { TrackLink } from 'app/components/track/TrackLink'
import { UserLink } from 'app/components/user-link'
import { useRoute } from 'app/hooks/useRoute'
import { flexRowCentered, makeStyles } from 'app/styles'

const { getCount } = remixesPageSelectors
const { fetchTrackSucceeded } = remixesPageActions

const messages = {
  remix: 'Remix',
  of: 'of',
  by: 'by',
  header: 'Remixes'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  header: {
    alignItems: 'center',
    margin: spacing(4),
    marginTop: spacing(6)
  },
  track: {
    ...flexRowCentered()
  },
  text: {
    ...typography.body,
    color: palette.neutral,
    textAlign: 'center',
    lineHeight: 20
  }
}))

export const TrackRemixesScreen = () => {
  const dispatch = useDispatch()

  const { params } = useRoute<'TrackRemixes'>()
  const { data: track } = useTrackByParams(params)
  const trackId = track?.track_id
  const { lineup, loadNextPage } = useRemixes({ trackId })
  const count = useSelector(getCount)

  const styles = useStyles()

  useEffect(() => {
    if (trackId) {
      dispatch(fetchTrackSucceeded({ trackId }))
      dispatch(
        tracksActions.fetchLineupMetadatas(0, 10, false, {
          trackId
        })
      )

      return function cleanup() {
        dispatch(tracksActions.reset())
      }
    }
  }, [dispatch, trackId])

  const remixesText = pluralize(messages.remix, count, 'es', !count)
  const remixesCountText = `${count || ''} ${remixesText} ${messages.of}`

  return (
    <Screen>
      <ScreenHeader text={messages.header} icon={IconRemix} />
      <ScreenContent>
        <Lineup
          tanQuery
          lineup={lineup}
          loadMore={loadNextPage}
          header={
            track ? (
              <View style={styles.header}>
                <Text style={styles.text}>{remixesCountText}</Text>
                <Text style={styles.text}>
                  <TrackLink trackId={track.track_id} variant='visible' />
                  <Text>{messages.by}</Text>{' '}
                  <UserLink userId={track.owner_id} variant='visible' />
                </Text>
              </View>
            ) : null
          }
          actions={tracksActions}
        />
      </ScreenContent>
    </Screen>
  )
}
