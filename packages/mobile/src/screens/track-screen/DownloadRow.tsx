import { useCallback } from 'react'

import { cacheTracksSelectors } from '@audius/common'
import type { DownloadQuality, CommonState, ID } from '@audius/common'
import { View } from 'react-native'
import { useSelector } from 'react-redux'

import { IconReceive } from '@audius/harmony-native'
import { Text } from 'app/components/core'
import { PlainButton } from 'app/harmony-native/components/Button/PlainButton/PlainButton'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

const { getTrack } = cacheTracksSelectors

const messages = {
  fullTrack: 'Full Track'
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: palette.borderDefault,
    padding: spacing(4)
  },
  content: {
    flexDirection: 'row',
    gap: spacing(6),
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  titleContainer: {
    gap: spacing(1)
  }
}))

type DownloadRowProps = {
  trackId: ID
  quality: DownloadQuality
  // onDownload: (trackId: ID, category?: string, parentTrackId?: ID) => void
  index: number
}

export const DownloadRow = ({
  trackId,
  // onDownload,
  index
}: DownloadRowProps) => {
  const styles = useStyles()
  const track = useSelector((state: CommonState) =>
    getTrack(state, { id: trackId })
  )
  const { neutralLight4 } = useThemeColors()

  const handlePress = useCallback(() => {
    if (track) {
      // onDownload(trackId, track.stem_of?.category, trackId)
    }
  }, [track])

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <Text color='neutralLight4'>{index}</Text>
        <View style={styles.titleContainer}>
          <Text>{track?.stem_of?.category ?? messages.fullTrack}</Text>
          <Text color='neutralLight4'>{track?.orig_filename}</Text>
        </View>
      </View>
      <View>
        <PlainButton onPress={handlePress}>
          <IconReceive
            fill={neutralLight4}
            width={spacing(4)}
            height={spacing(4)}
          />
        </PlainButton>
      </View>
    </View>
  )
}
