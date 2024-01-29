import { View } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'

import { IconDownload } from '@audius/harmony-native'
import { Text, Tile } from 'app/components/core'
import { OfflinePlaceholder } from 'app/components/offline-placeholder'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

const messages = {
  noDownloadedTracks: 'Download Your Favorites So You Can Listen Offline!'
}

const useStyles = makeStyles(({ typography, spacing, palette }) => ({
  container: {
    flexDirection: 'row',
    paddingVertical: spacing(4)
  },
  tile: {
    margin: spacing(3),
    marginBottom: spacing(0)
  },
  iconRoot: {
    alignSelf: 'center',
    paddingHorizontal: spacing(4)
  },
  text: {
    flexShrink: 1,
    fontSize: typography.fontSize.medium,
    lineHeight: 24,
    color: palette.neutral
  }
}))

export const NoTracksPlaceholder = () => {
  const styles = useStyles()
  const { neutralLight4 } = useThemeColors()

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
      <Tile style={styles.tile}>
        <View style={styles.container}>
          <View style={styles.iconRoot}>
            <IconDownload fill={neutralLight4} height={35} width={35} />
          </View>
          <Text style={styles.text}>{messages.noDownloadedTracks}</Text>
        </View>
      </Tile>
      <OfflinePlaceholder />
    </Animated.View>
  )
}
