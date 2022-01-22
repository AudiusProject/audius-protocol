import React from 'react'

import { ParamListBase } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ScrollView, StyleSheet, View } from 'react-native'

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
      display: 'flex',
      // TODO: Fix this
      marginBottom: 240
    },
    cardContainer: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-evenly',
      padding: 12,
      paddingTop: 24
    },
    card: {
      flex: 1,
      flexBasis: '40%',
      marginBottom: 8
    }
  })

export const ArtistsTab = ({ navigation }: Props) => {
  const styles = useThemedStyles(createStyles)

  return (
    <ScrollView style={styles.tabContainer}>
      <TabInfo header={messages.infoHeader} />
      <View style={styles.contentContainer}>
        <View style={styles.cardContainer} />
      </View>
    </ScrollView>
  )
}
