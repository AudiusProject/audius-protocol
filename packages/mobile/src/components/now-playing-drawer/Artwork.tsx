import type { CommonState, Nullable, Track } from '@audius/common'
import {
  DogEarType,
  SquareSizes,
  averageColorSelectors,
  useGatedContentAccess,
  playerSelectors
} from '@audius/common'
import { Dimensions } from 'react-native'
import { useSelector } from 'react-redux'

import { DogEar, Shadow } from 'app/components/core'
import { TrackImage } from 'app/components/image/TrackImage'
import { makeStyles } from 'app/styles'
const { getPreviewing } = playerSelectors
const { getDominantColorsByTrack } = averageColorSelectors

const dimensions = Dimensions.get('window')
const spacing = 24

const useStyles = makeStyles(({ palette }) => ({
  root: {
    marginLeft: spacing,
    marginRight: spacing,
    maxHeight: dimensions.width - spacing * 2,
    alignSelf: 'center'
  },
  image: {
    alignSelf: 'center',
    borderRadius: 8,
    borderColor: palette.white,
    borderWidth: 2,
    overflow: 'hidden',
    height: '100%',
    width: '100%',
    aspectRatio: 1
  }
}))

type ArtworkProps = {
  track: Nullable<Track>
}

export const Artwork = ({ track }: ArtworkProps) => {
  const styles = useStyles()

  const dominantColors = useSelector((state: CommonState) =>
    getDominantColorsByTrack(state, {
      track
    })
  )

  let shadowColor = 'rgb(0,0,0)'
  const dominantColor = dominantColors ? dominantColors[0] : null
  if (dominantColor) {
    const { r, g, b } = dominantColor
    shadowColor = `rgb(${r.toFixed()},${g.toFixed()},${b.toFixed()})`
  }

  const { doesUserHaveAccess } = useGatedContentAccess(track)
  const isPreviewing = useSelector(getPreviewing)
  const shouldShowDogEar =
    track?.stream_conditions &&
    'usdc_purchase' in track.stream_conditions &&
    (!doesUserHaveAccess || isPreviewing)

  return (
    <Shadow opacity={0.2} radius={8} color={shadowColor} style={styles.root}>
      {shouldShowDogEar ? (
        <DogEar type={DogEarType.USDC_PURCHASE} borderOffset={2} />
      ) : null}
      <TrackImage
        style={styles.image}
        track={track}
        size={SquareSizes.SIZE_1000_BY_1000}
      />
    </Shadow>
  )
}
