import React, { useCallback, useState } from 'react'

import {
  Collectible,
  CollectibleMediaType
} from 'audius-client/src/common/models/Collectible'
import {
  ImageStyle,
  StyleSheet,
  TouchableWithoutFeedback,
  View
} from 'react-native'

import IconVolume from '../../assets/images/iconVolume.svg'
import IconMute from '../../assets/images/iconVolume0.svg'
import AutoSizeImage from '../image/AutoSizeImage'
import AutoSizeVideo from '../video/AutoSizeVideo'
import { ThemeColors, useThemedStyles } from '../../hooks/useThemedStyles'
import { useColor } from '../../utils/theme'

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    container: {
      borderRadius: 8
    },

    volumeIconContainer: {
      position: 'absolute',
      height: 42,
      width: 42,
      bottom: 8,
      right: 8,
      borderWidth: 2,
      borderColor: themeColors.neutralLight5,
      borderRadius: 21
    },

    volumeIcon: {
      marginTop: 10,
      marginLeft: 10
    }
  })

export const CollectibleMedia: React.FC<{
  collectible: Collectible
}> = ({ collectible }) => {
  const { mediaType, imageUrl, videoUrl, gifUrl, threeDUrl } = collectible

  const styles = useThemedStyles(createStyles)
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
        source={{ uri: gifUrl }}
        style={styles.container as ImageStyle}
      />
    ),
    [CollectibleMediaType.GIF]: () => (
      <AutoSizeImage
        source={{ uri: gifUrl }}
        style={styles.container as ImageStyle}
      />
    ),
    [CollectibleMediaType.VIDEO]: () => (
      <TouchableWithoutFeedback onPress={toggleMute}>
        <View>
          <AutoSizeVideo
            fullscreen={false}
            muted={isMuted}
            source={{ uri: videoUrl }}
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
        source={{ uri: imageUrl }}
        style={styles.container as ImageStyle}
      />
    )
  }

  return (
    renderByMediaType[mediaType] ??
    renderByMediaType[CollectibleMediaType.IMAGE]
  )()
}
