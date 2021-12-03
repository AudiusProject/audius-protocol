import React, { useCallback } from 'react'

import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Text, View } from 'react-native'

import { FeedStackParamList } from 'app/components/app-navigator/types'
import Button from 'app/components/button'

type Props = NativeStackScreenProps<FeedStackParamList, 'feed'>

const FeedScreen = ({ navigation }: Props) => {
  const handlePress = useCallback(() => {
    navigation.navigate('track', { id: 1 })
  }, [navigation])

  return (
    <View>
      <Text>Example feed screen</Text>
      <Button title='Go to track screen' onPress={handlePress} />
    </View>
  )
}

export default FeedScreen
