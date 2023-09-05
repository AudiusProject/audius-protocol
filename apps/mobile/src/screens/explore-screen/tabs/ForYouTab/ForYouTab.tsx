import { useRef } from 'react'

import { View } from 'react-native'

import type { ScrollViewElement } from 'app/components/core'
import { ScrollView } from 'app/components/core'
import { useScrollToTop } from 'app/hooks/useScrollToTop'
import { makeStyles } from 'app/styles'

import {
  LET_THEM_DJ,
  TRENDING_PLAYLISTS,
  TRENDING_UNDERGROUND,
  TOP_ALBUMS
} from '../../collections'
import { ColorTile } from '../../components/ColorTile'
import { TabInfo } from '../../components/TabInfo'
import {
  HEAVY_ROTATION,
  BEST_NEW_RELEASES,
  UNDER_THE_RADAR,
  MOST_LOVED,
  REMIXABLES,
  FEELING_LUCKY
} from '../../smartCollections'

const messages = {
  infoHeader: 'Just For You',
  infoText:
    'Content curated for you based on your likes, reposts, and follows. Refreshes often so if you like a track, favorite it.'
}

const useStyles = makeStyles(({ spacing }) => ({
  tabContainer: {
    flex: 1
  },
  contentContainer: {
    padding: spacing(3),
    paddingVertical: spacing(6),
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  tile: {
    marginBottom: spacing(2),
    flex: 1,
    flexBasis: '100%'
  },
  halfTile: {
    flexBasis: '40%'
  },
  rightMargin: {
    marginRight: spacing(2)
  }
}))

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

const tenTileLayout = {
  halfTiles: [3, 4, 5, 6, 8, 9],
  leftHalfTiles: [3, 5, 8]
}

export const ForYouTab = () => {
  const styles = useStyles()

  const scrollViewRef = useRef<ScrollViewElement>(null)
  useScrollToTop(() => {
    scrollViewRef.current?.scrollTo({
      y: 0,
      animated: true
    })
  })

  return (
    <ScrollView style={styles.tabContainer} ref={scrollViewRef}>
      <TabInfo header={messages.infoHeader} text={messages.infoText} />
      <View style={styles.contentContainer}>
        {tiles.map((tile, idx) => (
          <ColorTile
            style={[
              styles.tile,
              tenTileLayout.halfTiles.includes(idx) && styles.halfTile,
              tenTileLayout.leftHalfTiles.includes(idx) && styles.rightMargin
            ]}
            key={tile.title}
            {...tile}
          />
        ))}
      </View>
    </ScrollView>
  )
}
