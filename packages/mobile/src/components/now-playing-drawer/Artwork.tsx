import React from 'react'

import { SquareSizes } from 'audius-client/src/common/models/ImageSizes'
import { Track } from 'audius-client/src/common/models/Track'
import { getDominantColorsByTrack } from 'audius-client/src/common/store/average-color/slice'
import { Dimensions, StyleSheet, View } from 'react-native'
import { Shadow } from 'react-native-shadow-2'

import { DynamicImage } from 'app/components/core'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { useTrackCoverArt } from 'app/hooks/useTrackCoverArt'
import { ThemeColors } from 'app/utils/theme'

const dimensions = Dimensions.get('window')
const spacing = 24

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    root: {
      marginLeft: spacing,
      marginRight: spacing,
      width: dimensions.width - spacing * 2,
      height: dimensions.width - spacing * 2
    },
    shadow: {
      alignSelf: 'stretch',
      height: '100%'
    },
    image: {
      borderRadius: 8,
      borderColor: themeColors.white,
      borderWidth: 2,
      overflow: 'hidden',
      height: '100%',
      width: '100%'
    }
  })

type ArtworkProps = {
  track: Track
}

export const Artwork = ({ track }: ArtworkProps) => {
  const styles = useThemedStyles(createStyles)
  const image = useTrackCoverArt(
    track.track_id,
    track._cover_art_sizes,
    SquareSizes.SIZE_480_BY_480
  )

  const dominantColors = useSelectorWeb(state =>
    getDominantColorsByTrack(state, {
      track
    })
  )
  const dominantColor = dominantColors ? dominantColors[0] : null
  const shadowColor = dominantColor
    ? `rgba(${dominantColor.r},${dominantColor.g},${dominantColor.b},0.1)`
    : 'rgba(0,0,0,0)'

  return (
    <View style={styles.root}>
      <Shadow
        viewStyle={styles.shadow}
        offset={[0, 1]}
        radius={15}
        distance={10}
        startColor={shadowColor}
      >
        <View style={styles.image}>
          <DynamicImage source={{ uri: image }} />
        </View>
      </Shadow>
    </View>
  )
}
