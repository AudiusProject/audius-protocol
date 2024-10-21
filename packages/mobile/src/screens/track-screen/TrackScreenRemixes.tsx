import { useEffect } from 'react'

import type { Track } from '@audius/common/models'
import {
  lineupSelectors,
  remixesPageLineupActions,
  remixesPageSelectors
} from '@audius/common/store'
import { useDispatch, useSelector } from 'react-redux'

import {
  Button,
  Flex,
  IconRemix,
  IconArrowRight,
  Text
} from '@audius/harmony-native'
import { Lineup } from 'app/components/lineup'
import { useNavigation } from 'app/hooks/useNavigation'

const { getLineup: getRemixesLineup } = remixesPageSelectors
const { makeGetLineupMetadatas } = lineupSelectors
const getRemixesTracksLineup = makeGetLineupMetadatas(getRemixesLineup)

const messages = {
  viewAllRemixes: 'View All Remixes',
  remixes: 'Remixes Of This Track'
}

const MAX_REMIXES_TO_DISPLAY = 6

type TrackScreenRemixesProps = {
  track: Track
}

export const TrackScreenRemixes = (props: TrackScreenRemixesProps) => {
  const { track } = props
  const { _remixes } = track
  const navigation = useNavigation()
  const dispatch = useDispatch()
  const remixesLineup = useSelector(getRemixesTracksLineup)
  const trackId = track?.track_id

  useEffect(() => {
    if (trackId) {
      dispatch(
        remixesPageLineupActions.fetchLineupMetadatas(0, 10, false, {
          trackId
        })
      )
    }

    return function cleanup() {
      dispatch(remixesPageLineupActions.reset())
    }
  }, [dispatch, trackId])

  const handlePressGoToAllRemixes = () => {
    navigation.push('TrackRemixes', { id: track.track_id })
  }

  const remixTrackIds = _remixes?.map(({ track_id }) => track_id) ?? null

  if (!remixTrackIds || !remixTrackIds.length) {
    return null
  }

  return (
    <Flex>
      <Flex row alignItems='center' gap='s'>
        <IconRemix color='default' />
        <Text variant='title'>{messages.remixes}</Text>
      </Flex>
      <Lineup
        lineup={remixesLineup}
        actions={remixesPageLineupActions}
        count={Math.min(MAX_REMIXES_TO_DISPLAY, remixTrackIds.length)}
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
  )
}
