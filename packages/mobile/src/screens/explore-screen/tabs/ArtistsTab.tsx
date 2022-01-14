import React, { useCallback } from 'react'

import { ParamListBase } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Button, StyleSheet, View } from 'react-native'

import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { ThemeColors } from 'app/utils/theme'

import { TabInfo } from '../components/TabInfo'

const messages = {
  infoHeader: 'Featured Artists'
}

type Props = {
  navigation: NativeStackNavigationProp<ParamListBase, keyof ParamListBase>
}

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    tabContainer: {
      display: 'flex'
    },
    contentContainer: {
      display: 'flex'
    }
  })

export const ArtistsTab = ({ navigation }: Props) => {
  const styles = useThemedStyles(createStyles)

  const handlePress = useCallback(() => {
    navigation.navigate('profile', { id: 1 })
  }, [navigation])

  return (
    <View style={styles.tabContainer}>
      <TabInfo header={messages.infoHeader} />
      <View style={styles.contentContainer}>
        <Button title='Go to single artist view' onPress={handlePress} />
      </View>
    </View>
  )
}
