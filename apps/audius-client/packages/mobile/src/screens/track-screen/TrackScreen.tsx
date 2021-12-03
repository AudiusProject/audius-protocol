import React, { useCallback } from 'react'

import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Text, View } from 'react-native'

import { BaseStackParamList } from 'app/components/app-navigator/types'
import Button from 'app/components/button'

// We might need to allow BaseStackParamList to be generic here
// to get all the relevant params
type Props = NativeStackScreenProps<BaseStackParamList, 'track'>

const TrackScreen = ({ navigation }: Props) => {
  const handlePress = useCallback(() => {
    navigation.navigate('profile', { id: 1 })
  }, [navigation])

  return (
    <View>
      <Text>Example track screen</Text>
      <Button title='Go to profile screen' onPress={handlePress} />
    </View>
  )
}

export default TrackScreen
