import { View } from 'react-native'

import IconDownload from 'app/assets/images/iconDownloadGray.svg'
import { Text, Tile } from 'app/components/core'
import { OfflinePlaceholder } from 'app/components/offline-placeholder'
import { makeStyles } from 'app/styles'

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
  return (
    <View>
      <Tile style={styles.tile}>
        <View style={styles.container}>
          <View style={styles.iconRoot}>
            <IconDownload />
          </View>
          <Text style={styles.text}>{messages.noDownloadedTracks}</Text>
        </View>
      </Tile>
      <OfflinePlaceholder />
    </View>
  )
}
