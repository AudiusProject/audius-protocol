import { View } from 'react-native'

import IconImage from 'app/assets/images/iconImage.svg'
import { DynamicImage, LinearProgress, Text, Tile } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

import type { CompletedTrackMetadata } from './types'

const useStyles = makeStyles(({ spacing, palette }) => ({
  tile: {
    marginBottom: spacing(4)
  },
  tileContent: { padding: spacing(4) },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing(4)
  },
  artwork: {
    height: spacing(12),
    width: spacing(12),
    marginRight: spacing(4),
    backgroundColor: palette.neutralLight6
  }
}))

type UploadingTrackTileProps = {
  track: CompletedTrackMetadata
  uploadProgress: number
}
export const UploadingTrackTile = (props: UploadingTrackTileProps) => {
  const { track, uploadProgress } = props
  const { name, artwork } = track
  const styles = useStyles()
  const { neutralLight8 } = useThemeColors()

  return (
    <Tile styles={{ root: styles.tile, content: styles.tileContent }}>
      <View style={styles.content}>
        <DynamicImage uri={artwork.url} style={styles.artwork}>
          {artwork.url ? null : (
            <IconImage
              fill={neutralLight8}
              height={spacing(8)}
              width={spacing(8)}
            />
          )}
        </DynamicImage>
        <Text fontSize='large' weight='demiBold'>
          {name}
        </Text>
      </View>
      <LinearProgress value={uploadProgress} />
    </Tile>
  )
}
