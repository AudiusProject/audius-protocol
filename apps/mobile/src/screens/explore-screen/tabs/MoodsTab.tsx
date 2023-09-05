import { View } from 'react-native'

import { ScrollView } from 'app/components/core'
import { makeStyles } from 'app/styles'

import {
  CHILL_PLAYLISTS,
  PROVOKING_PLAYLISTS,
  INTIMATE_PLAYLISTS,
  UPBEAT_PLAYLISTS,
  INTENSE_PLAYLISTS
} from '../collections'
import { ColorTile } from '../components/ColorTile'
import { TabInfo } from '../components/TabInfo'

const messages = {
  infoHeader: 'Playlists to Fit Your Mood',
  infoText: 'Playlists made by Audius users, sorted by mood and feel.'
}

const useStyles = makeStyles(({ spacing }) => ({
  tabContainer: {
    flex: 1
  },
  contentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing(3),
    paddingVertical: spacing(6)
  }
}))

const tiles = [
  CHILL_PLAYLISTS,
  UPBEAT_PLAYLISTS,
  INTENSE_PLAYLISTS,
  PROVOKING_PLAYLISTS,
  INTIMATE_PLAYLISTS
]

export const MoodsTab = () => {
  const styles = useStyles()

  return (
    <ScrollView style={styles.tabContainer}>
      <TabInfo header={messages.infoHeader} text={messages.infoText} />
      <View style={styles.contentContainer}>
        {tiles.map((tile, idx) => (
          <ColorTile
            style={{
              flex: 1,
              flexBasis: idx === 0 ? '100%' : '40%',
              marginLeft: idx && !(idx % 2) ? 8 : 0,
              marginBottom: 8
            }}
            key={tile.title}
            isIncentivized={tile.incentivized}
            {...tile}
          />
        ))}
      </View>
    </ScrollView>
  )
}
