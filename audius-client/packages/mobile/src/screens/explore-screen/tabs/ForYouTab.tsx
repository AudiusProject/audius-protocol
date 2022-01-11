import React from 'react'

import { ParamListBase } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { StyleSheet, View } from 'react-native'

import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { ThemeColors } from 'app/utils/theme'

import { TabInfo } from './TabInfo'

const messages = {
  infoHeader: 'Just For You',
  infoText:
    'Content curated for you based on your likes, reposts, and follows. Refreshes often so if you like a track, favorite it.'
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

export const ForYouTab = ({ navigation }: Props) => {
  const styles = useThemedStyles(createStyles)

  return (
    <View style={styles.tabContainer}>
      <TabInfo header={messages.infoHeader} text={messages.infoText} />
      <View style={styles.contentContainer} />
    </View>
  )
}
