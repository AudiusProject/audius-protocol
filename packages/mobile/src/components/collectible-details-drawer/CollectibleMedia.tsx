import { useCallback, useState } from 'react'

import type { Collectible } from '@audius/common'
import { CollectibleMediaType } from '@audius/common'
import type { ImageStyle } from 'react-native'
import { TouchableWithoutFeedback, View } from 'react-native'

import { IconVolume } from '@audius/harmony-native'
import { IconMute } from '@audius/harmony-native'
import AutoSizeImage from 'app/components/image/AutoSizeImage'
import AutoSizeVideo from 'app/components/video/AutoSizeVideo'
import { makeStyles } from 'app/styles'
import { useColor } from 'app/utils/theme'

const useStyles = makeStyles(({ palette, spacing }) => ({
  container: {
    borderRadius: 8
  },

  volumeIconContainer: {
    position: 'absolute',
    height: spacing(10),
    width: spacing(10),
    bottom: spacing(2),
    right: spacing(2),
    borderWidth: 2,
    borderColor: palette.neutralLight5,
    borderRadius: spacing(10) / 2,
    justifyContent: 'center',
    alignItems: 'center'
  },

  volumeIcon: {}
}))

type CollectibleMediaProps = {
  collectible: Collectible
}

export const CollectibleMedia = (props: CollectibleMediaProps) => {
  const { collectible } = props
  const { mediaType, imageUrl, videoUrl, gifUrl } = collectible

  const styles = useStyles()
  const neutralLight5 = useColor('neutralLight5')

  const [isMuted, setIsMuted] = useState<boolean>(true)

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted)
  }, [isMuted, setIsMuted])

  const VolumeIcon = isMuted ? IconMute : IconVolume

  const renderByMediaType = {
    // TODO: Implement 3D model viewing on mobile
    [CollectibleMediaType.THREE_D]: () => (
      <AutoSizeImage
        source={{ uri: gifUrl ?? undefined }}
        style={styles.container as ImageStyle}
      />
    ),
    [CollectibleMediaType.GIF]: () => (
      <AutoSizeImage
        source={{ uri: gifUrl ?? undefined }}
        style={styles.container as ImageStyle}
      />
    ),
    [CollectibleMediaType.VIDEO]: () => (
      <TouchableWithoutFeedback onPress={toggleMute}>
        <View>
          <AutoSizeVideo
            repeat={true}
            ignoreSilentSwitch={'ignore'}
            fullscreen={false}
            muted={isMuted}
            source={{ uri: videoUrl ?? undefined }}
            style={styles.container}
          />
          <View style={styles.volumeIconContainer}>
            <VolumeIcon
              style={styles.volumeIcon}
              height={18}
              width={18}
              fill={neutralLight5}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    ),
    [CollectibleMediaType.IMAGE]: () => (
      <AutoSizeImage
        source={{ uri: imageUrl ?? undefined }}
        style={styles.container as ImageStyle}
      />
    )
  }

  return (
    renderByMediaType[mediaType] ??
    renderByMediaType[CollectibleMediaType.IMAGE]
  )()
}
