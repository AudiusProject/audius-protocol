import React from 'react'

import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Text, View } from 'react-native'

import { BaseStackParamList } from 'app/components/app-navigator/types'

// We might need to allow BaseStackParamList to be generic here
// to get all the relevant params
type Props = NativeStackScreenProps<BaseStackParamList, 'track'>

const ProfileScreen = ({ navigation }: Props) => {
  return (
    <View>
      <Text>Example profile screen</Text>
    </View>
  )
}

export default ProfileScreen
