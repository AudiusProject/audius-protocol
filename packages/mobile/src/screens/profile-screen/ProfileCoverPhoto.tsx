import { BlurView } from '@react-native-community/blur'
import { Animated, StyleSheet } from 'react-native'

import BadgeArtist from 'app/assets/images/badgeArtist.svg'
import { CoverPhoto } from 'app/components/image/CoverPhoto'
import { makeStyles } from 'app/styles'

import { useSelectProfile } from './selectors'

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)

const useStyles = makeStyles(({ spacing }) => ({
  coverPhoto: {
    height: 96
  },
  artistBadge: {
    position: 'absolute',
    top: spacing(3),
    right: spacing(3)
  }
}))

const interpolateBlurViewOpacity = (scrollY: Animated.Value) =>
  scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1, 0],
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

type ProfileCoverPhotoProps = { scrollY?: Animated.Value }

export const ProfileCoverPhoto = (props: ProfileCoverPhotoProps) => {
  const { scrollY } = props
  const styles = useStyles()
  const user = useSelectProfile(['user_id', 'track_count'])
  const { user_id, track_count } = user

  const isArtist = track_count > 0

  return (
    <>
      <CoverPhoto
        animatedValue={scrollY}
        style={styles.coverPhoto}
        userId={user_id}
      >
        <AnimatedBlurView
          blurType='dark'
          blurAmount={100}
          style={[
            { ...StyleSheet.absoluteFillObject, zIndex: 2 },
            scrollY
              ? { opacity: interpolateBlurViewOpacity(scrollY) }
              : undefined
          ]}
        />
      </CoverPhoto>
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
