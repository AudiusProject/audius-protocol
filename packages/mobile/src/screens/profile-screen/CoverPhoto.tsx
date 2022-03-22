import { BlurView } from '@react-native-community/blur'
import { WidthSizes } from 'audius-client/src/common/models/ImageSizes'
import { Animated, StyleSheet } from 'react-native'

import BadgeArtist from 'app/assets/images/badgeArtist.svg'
import { DynamicImage } from 'app/components/core'
import { useUserCoverPhoto } from 'app/hooks/useUserCoverPhoto'
import { makeStyles } from 'app/styles/makeStyles'

import { useSelectProfile } from './selectors'

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)

const useStyles = makeStyles(({ spacing }) => ({
  artistBadge: {
    position: 'absolute',
    top: spacing(5),
    right: spacing(3)
  },
  imageRoot: {
    height: 96
  },
  image: {
    height: '100%'
  }
}))

const interpolateBlurViewOpacity = (scrollY: Animated.Value) =>
  scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [0.5, 0],
    extrapolateLeft: 'extend',
    extrapolateRight: 'clamp'
  })

const interpolateBadgeImagePosition = (scrollY: Animated.Value) =>
  scrollY.interpolate({
    inputRange: [-200, 0],
    outputRange: [-200, 0],
    extrapolateLeft: 'extend',
    extrapolateRight: 'clamp'
  })

export const CoverPhoto = ({ scrollY }: { scrollY?: Animated.Value }) => {
  const styles = useStyles()
  const { user_id, _cover_photo_sizes, track_count } = useSelectProfile([
    'user_id',
    '_cover_photo_sizes',
    'track_count'
  ])

  const coverPhoto = useUserCoverPhoto({
    id: user_id,
    sizes: _cover_photo_sizes,
    size: WidthSizes.SIZE_2000
  })

  const isArtist = track_count > 0

  return (
    <>
      <DynamicImage
        animatedValue={scrollY}
        uri={coverPhoto}
        styles={{ root: styles.imageRoot, image: styles.image }}
      >
        <AnimatedBlurView
          blurType={'dark'}
          blurAmount={100}
          style={[
            { ...StyleSheet.absoluteFillObject, zIndex: 2 },
            scrollY
              ? { opacity: interpolateBlurViewOpacity(scrollY) }
              : undefined
          ]}
        />
      </DynamicImage>
      {isArtist ? (
        <Animated.View
          style={[
            styles.artistBadge,
            scrollY
              ? {
                  transform: [
                    {
                      translateY: interpolateBadgeImagePosition(scrollY)
                    }
                  ]
                }
              : undefined
          ]}
        >
          <BadgeArtist />
        </Animated.View>
      ) : null}
    </>
  )
}
