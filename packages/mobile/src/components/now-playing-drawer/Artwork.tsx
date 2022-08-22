import React from 'react'

import type { Track } from '@audius/common'
import { SquareSizes, averageColorSelectors } from '@audius/common'
import { Dimensions, StyleSheet, View } from 'react-native'
import { Shadow } from 'react-native-shadow-2'

import { DynamicImage } from 'app/components/core'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { useTrackCoverArt } from 'app/hooks/useTrackCoverArt'
import type { ThemeColors } from 'app/utils/theme'
const getDominantColorsByTrack = averageColorSelectors.getDominantColorsByTrack

const dimensions = Dimensions.get('window')
const spacing = 24

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    root: {
      marginLeft: spacing,
      marginRight: spacing,
      maxHeight: dimensions.width - spacing * 2,
      alignSelf: 'center'
    },
    shadow: {
      alignSelf: 'flex-start'
    },
    image: {
      alignSelf: 'center',
      borderRadius: 8,
      borderColor: themeColors.white,
      borderWidth: 2,
      overflow: 'hidden',
      height: '100%',
      width: '100%',
      aspectRatio: 1
    }
  })

type ArtworkProps = {
  track: Track
}

export const Artwork = ({ track }: ArtworkProps) => {
  const styles = useThemedStyles(createStyles)
  const image = useTrackCoverArt({
    id: track.track_id,
    sizes: track._cover_art_sizes,
    size: SquareSizes.SIZE_1000_BY_1000
  })

  const dominantColors = useSelectorWeb((state) =>
    getDominantColorsByTrack(state, {
      track
    })
  )

  let shadowColor = 'rgba(0,0,0,0)'
  const dominantColor = dominantColors ? dominantColors[0] : null
  if (dominantColor) {
    const { r, g, b } = dominantColor
    shadowColor = `rgba(${r.toFixed()},${g.toFixed()},${b.toFixed()},0.1)`
  }

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
          <DynamicImage uri={image} />
        </View>
      </Shadow>
    </View>
  )
}
