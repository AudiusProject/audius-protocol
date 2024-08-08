import { createContext, useContext } from 'react'

import { useGetTrackById } from '@audius/common/api'
import { Status, UID, UserTrackMetadata } from '@audius/common/models'
import { Uid } from '@audius/common/utils'
import { Flex, Paper, Text } from '@audius/harmony'

import { useLineupContext } from 'components/lineup-v2/LineupV2'

type TrackTileContextType = {
  track: UserTrackMetadata
} & Omit<TrackTileV2Props, 'id'>

export const TrackTileContext = createContext<TrackTileContextType>({
  track: {} as UserTrackMetadata,
  uid: ''
})

export const useTrackTileContext = () => {
  return useContext(TrackTileContext)
}

const TrackTileV2Content = () => {
  const { onPlay } = useLineupContext()
  const { track, uid } = useTrackTileContext()

  const { title, user } = track

  return (
    <Paper w='100%' onClick={() => onPlay(uid)}>
      <Flex direction='column' alignItems='flex-start'>
        <Text>{title}</Text>
        <Text>{user.name}</Text>
      </Flex>
    </Paper>
  )
}

type TrackTileV2Props = {
  uid: UID
}

export const TrackTileV2 = (props: TrackTileV2Props) => {
  const { uid } = props
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
    <TrackTileContext.Provider value={{ track, uid }}>
      <TrackTileV2Content />
    </TrackTileContext.Provider>
  )
}
