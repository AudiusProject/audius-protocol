import { Dimensions, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { Text, Tile } from 'app/components/core'
import { Header } from 'app/components/header'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

const messages = {
  title: 'AUDIO & Rewards'
}

const screenHeight = Dimensions.get('window').height

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: screenHeight
  },
  tiles: {},
  tileRoot: {
    margin: spacing(3)
  },
  tile: {
    borderRadius: 6
  },
  tileContent: {}
}))

export const AudioScreen = () => {
  const styles = useStyles()
  const {
    pageHeaderGradientColor1,
    pageHeaderGradientColor2
  } = useThemeColors()

  return (
    <View style={styles.root}>
      <Header text={messages.title} />
      <View style={styles.tiles}>
        <Tile
          as={LinearGradient}
          colors={[pageHeaderGradientColor1, pageHeaderGradientColor2]}
          start={{ x: 1, y: 1 }}
          end={{ x: 0, y: 0 }}
          styles={{
            root: styles.tileRoot,
            tile: styles.tile,
            content: styles.tileContent
          }}
        >
          <Text>{'Audio'}</Text>
        </Tile>
        <Tile
          styles={{
            root: styles.tileRoot,
            tile: styles.tile,
            content: styles.tileContent
          }}
        >
          <Text>{'Wallet'}</Text>
        </Tile>
        <Tile
          styles={{
            root: styles.tileRoot,
            tile: styles.tile,
            content: styles.tileContent
          }}
        >
          <Text>{'Rewards'}</Text>
        </Tile>
        <Tile
          styles={{
            root: styles.tileRoot,
            tile: styles.tile,
            content: styles.tileContent
          }}
        >
          <Text>{'Trending Competitions'}</Text>
        </Tile>
        <Tile
          styles={{
            root: styles.tileRoot,
            tile: styles.tile,
            content: styles.tileContent
          }}
        >
          <Text>{'Tiers'}</Text>
        </Tile>
        <Tile
          styles={{
            root: styles.tileRoot,
            tile: styles.tile,
            content: styles.tileContent
          }}
        >
          <Text>{'What is audio '}</Text>
        </Tile>
      </View>
    </View>
  )
}
