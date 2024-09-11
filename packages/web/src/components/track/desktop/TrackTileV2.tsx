import { createContext, useContext } from 'react'

import { useGetTrackById } from '@audius/common/api'
import { Status, UID, UserTrackMetadata } from '@audius/common/models'
import { Uid } from '@audius/common/utils'
import { Flex, Paper, Text } from '@audius/harmony'

import { useLineupContext } from 'components/lineup-v2/LineupContext'

type TrackTileContextType = {
  track: UserTrackMetadata
} & Omit<TrackTileV2Props, 'id'>

export const TrackTileContext = createContext<TrackTileContextType>({
  track: {} as UserTrackMetadata,
  uid: '',
  lineupIndex: -1
})

export const useTrackTileContext = () => {
  return useContext(TrackTileContext)
}

const TrackTileV2Content = () => {
  const { onPlay } = useLineupContext()
  const { track, uid, lineupIndex } = useTrackTileContext()

  const { title, user } = track

  return (
    <Paper w='100%' onClick={() => onPlay(uid, lineupIndex)}>
      <Flex direction='column' alignItems='flex-start'>
        <Text>{title}</Text>
        <Text>{user.name}</Text>
      </Flex>
    </Paper>
  )
}

type TrackTileV2Props = {
  uid: UID
  lineupIndex: number // The lineupIndex of the track in the lineup list
}

export const TrackTileV2 = (props: TrackTileV2Props) => {
  const { uid, lineupIndex } = props
  const id = Number(Uid.getComponent(uid, 'id'))

  const { data: track, status } = useGetTrackById({ id })

  if (status === Status.LOADING) {
    // return skeleton
    return null
  }

  if (!track) {
    return null
  }

  return (
    <TrackTileContext.Provider value={{ track, uid, lineupIndex }}>
      <TrackTileV2Content />
    </TrackTileContext.Provider>
  )
}
