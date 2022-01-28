import React, { useCallback } from 'react'

import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { makeGetLineupMetadatas } from 'audius-client/src/common/store/lineup/selectors'
import { tracksActions } from 'audius-client/src/common/store/pages/track/lineup/actions'
import { getLineup } from 'audius-client/src/common/store/pages/track/selectors'
import { isEqual } from 'lodash'
import { Text, View } from 'react-native'

import { BaseStackParamList } from 'app/components/app-navigator/types'
import Button from 'app/components/button'
import { Lineup } from 'app/components/lineup'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

// We might need to allow BaseStackParamList to be generic here
// to get all the relevant params
type Props = NativeStackScreenProps<BaseStackParamList, 'track'>

const getMoreByArtistLineup = makeGetLineupMetadatas(getLineup)

const TrackScreen = ({ route, navigation }: Props) => {
  const handlePress = useCallback(() => {
    navigation.navigate('profile', { id: 1 })
  }, [navigation])

  const dispatchWeb = useDispatchWeb()
  const moreByArtistLineup = useSelectorWeb(getMoreByArtistLineup, isEqual)

  const playTrack = (uid?: string) => {
    dispatchWeb(tracksActions.play(uid))
  }

  const pauseTrack = () => {
    dispatchWeb(tracksActions.pause())
  }

  return (
    <View style={{ display: 'flex', flexDirection: 'column' }}>
      <Text>Example track screen</Text>
      <Button title='Go to profile screen' onPress={handlePress} />
      <Lineup
        actions={tracksActions}
        lineup={moreByArtistLineup}
        pauseTrack={pauseTrack}
        playTrack={playTrack}
      />
    </View>
  )
}

export default TrackScreen
