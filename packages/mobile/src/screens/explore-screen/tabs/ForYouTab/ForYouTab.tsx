import { useRef } from 'react'

import { ExploreCollectionsVariant } from '@audius/common/store'
import { View } from 'react-native'

import type { ScrollViewElement } from 'app/components/core'
import { ScrollView } from 'app/components/core'
import { useIsUSDCEnabled } from 'app/hooks/useIsUSDCEnabled'
import { useScrollToTop } from 'app/hooks/useScrollToTop'
import { makeStyles } from 'app/styles'

import {
  LET_THEM_DJ,
  TRENDING_PLAYLISTS,
  TRENDING_UNDERGROUND,
  TOP_ALBUMS,
  PREMIUM_TRACKS
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
    paddingBottom: spacing(6),
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
  PREMIUM_TRACKS,
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

const elevenTileLayout = {
  halfTiles: [4, 5, 6, 7, 9, 10],
  leftHalfTiles: [4, 6, 9]
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

  const isUSDCPurchasesEnabled = useIsUSDCEnabled()
  const filteredTiles = tiles.filter((tile) => {
    const isPremiumTracksTile =
      tile.variant === ExploreCollectionsVariant.DIRECT_LINK &&
      tile.title === PREMIUM_TRACKS.title
    return !isPremiumTracksTile || isUSDCPurchasesEnabled
  })

  return (
    <ScrollView style={styles.tabContainer} ref={scrollViewRef}>
      <TabInfo header={messages.infoHeader} text={messages.infoText} />
      <View style={styles.contentContainer}>
        {filteredTiles.map((tile, idx) => (
          <ColorTile
            style={[
              styles.tile,
              elevenTileLayout.halfTiles.includes(idx) && styles.halfTile,
              elevenTileLayout.leftHalfTiles.includes(idx) && styles.rightMargin
            ]}
            key={tile.title}
            {...tile}
          />
        ))}
      </View>
    </ScrollView>
  )
}
