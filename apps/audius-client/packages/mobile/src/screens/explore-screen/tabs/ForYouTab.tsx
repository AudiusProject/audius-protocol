import React, { useCallback } from 'react'

import { ParamListBase } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { push } from 'connected-react-router'
import { ScrollView, StyleSheet, View } from 'react-native'

import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { ThemeColors } from 'app/utils/theme'

import {
  LET_THEM_DJ,
  TRENDING_PLAYLISTS,
  TRENDING_UNDERGROUND,
  TOP_ALBUMS
} from '../collections'
import { ColorTile } from '../components/ColorTile'
import { TabInfo } from '../components/TabInfo'
import {
  HEAVY_ROTATION,
  BEST_NEW_RELEASES,
  UNDER_THE_RADAR,
  MOST_LOVED,
  REMIXABLES,
  FEELING_LUCKY
} from '../smartCollections'

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
      flex: 1,
      display: 'flex'
    },
    contentContainer: {
      display: 'flex',
      padding: 12,
      paddingVertical: 24,
      // TODO: Fix this
      marginBottom: 240
    }
  })

const tiles = [
  TRENDING_PLAYLISTS,
  TRENDING_UNDERGROUND,
  HEAVY_ROTATION,
  LET_THEM_DJ,
  BEST_NEW_RELEASES,
  UNDER_THE_RADAR,
  TOP_ALBUMS,
  REMIXABLES,
  MOST_LOVED,
  FEELING_LUCKY
]

export const ForYouTab = ({ navigation }: Props) => {
  const styles = useThemedStyles(createStyles)
  const dispatchWeb = useDispatchWeb()
  const goToRoute = useCallback((route: string) => dispatchWeb(push(route)), [
    dispatchWeb
  ])

  return (
    <ScrollView style={styles.tabContainer}>
      <TabInfo header={messages.infoHeader} text={messages.infoText} />
      <View style={styles.contentContainer}>
        {tiles.map(tile => (
          <ColorTile
            style={{ marginBottom: 8 }}
            key={tile.title}
            title={tile.title}
            description={tile.description}
            link={tile.link}
            goToRoute={goToRoute}
            gradientColors={tile.gradientColors}
            gradientAngle={tile.gradientAngle}
            shadowColor={tile.shadowColor}
            shadowOpacity={tile.shadowOpacity}
            icon={tile.icon}
            isIncentivized={tile.incentivized}
          />
        ))}
      </View>
    </ScrollView>
  )
}
