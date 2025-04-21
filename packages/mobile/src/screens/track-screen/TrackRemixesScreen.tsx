import { useEffect } from 'react'

import {
  useRemixContest,
  useRemixes,
  useTrackByParams
} from '@audius/common/api'
import { useFeatureFlag } from '@audius/common/hooks'
import { remixMessages as messages } from '@audius/common/messages'
import { FeatureFlags } from '@audius/common/services'
import {
  remixesPageLineupActions as tracksActions,
  remixesPageActions,
  remixesPageSelectors
} from '@audius/common/store'
import { pluralize } from '@audius/common/utils'
import { Text as RNText, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { Flex, IconRemix, IconTrophy, Text } from '@audius/harmony-native'
import {
  Screen,
  ScreenContent,
  ScreenHeader,
  ScrollView
} from 'app/components/core'
import { ScreenPrimaryContent } from 'app/components/core/Screen/ScreenPrimaryContent'
import { Lineup } from 'app/components/lineup'
import { TanQueryLineup } from 'app/components/lineup/TanQueryLineup'
import { TrackLink } from 'app/components/track/TrackLink'
import { UserLink } from 'app/components/user-link'
import { useRoute } from 'app/hooks/useRoute'
import { flexRowCentered, makeStyles } from 'app/styles'

const { getCount } = remixesPageSelectors
const { fetchTrackSucceeded } = remixesPageActions
const legacyMessages = {
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
  const count = useSelector(getCount)
  const { data, isFetching, isPending, loadNextPage, lineup, pageSize } =
    useRemixes({
      trackId: track?.track_id,
      includeOriginal: true
    })
  const { isEnabled: isRemixContestEnabled } = useFeatureFlag(
    FeatureFlags.REMIX_CONTEST
  )
  const { data: contest } = useRemixContest(trackId)
  const isRemixContest = isRemixContestEnabled && contest

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

  const remixesText = pluralize(legacyMessages.remix, count, 'es', !count)
  const remixesCountText = `${count || ''} ${remixesText} ${legacyMessages.of}`

  return (
    <Screen>
      <ScreenHeader
        text={
          isRemixContest ? messages.submissionsTitle : messages.remixesTitle
        }
        icon={isRemixContest ? IconTrophy : IconRemix}
      />
      <ScreenContent>
        {isRemixContest ? (
          <ScreenPrimaryContent>
            <ScrollView>
              <Flex ph='l' mt='l'>
                <Text variant='title'>{messages.originalTrack}</Text>
              </Flex>

              <TanQueryLineup
                queryData={data}
                isFetching={isFetching}
                isPending={isPending}
                loadNextPage={loadNextPage}
                lineup={lineup}
                actions={tracksActions}
                pageSize={pageSize}
                hasMore={false}
                leadingElementId={0}
                leadingElementDelineator={
                  <Flex justifyContent='space-between' ph='l' pt='xl'>
                    {count ? (
                      <Text variant='title'>
                        {count} {pluralize(messages.submissions, count)}
                      </Text>
                    ) : null}
                  </Flex>
                }
              />
            </ScrollView>
          </ScreenPrimaryContent>
        ) : (
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
                    <RNText>{legacyMessages.by}</RNText>{' '}
                    <UserLink userId={track.owner_id} variant='visible' />
                  </Text>
                </View>
              ) : null
            }
            actions={tracksActions}
          />
        )}
      </ScreenContent>
    </Screen>
  )
}
