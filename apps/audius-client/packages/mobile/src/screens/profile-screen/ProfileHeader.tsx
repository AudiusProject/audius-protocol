import { useCallback } from 'react'

import { getUserId } from 'audius-client/src/common/store/account/selectors'
import type { Animated } from 'react-native'
import { LayoutAnimation, View } from 'react-native'
import { useToggle } from 'react-use'

import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'

import { ArtistRecommendations } from './ArtistRecommendations'
import { CoverPhoto } from './CoverPhoto'
import { ExpandableBio } from './ExpandableBio'
import { ProfileInfo } from './ProfileInfo'
import { ProfileMetrics } from './ProfileMetrics'
import { ProfilePicture } from './ProfilePicture'
import { ProfileSocials } from './ProfileSocials'
import { UploadTrackButton } from './UploadTrackButton'
import { useSelectProfileRoot } from './selectors'

const useStyles = makeStyles(({ palette, spacing }) => ({
  header: {
    backgroundColor: palette.neutralLight10,
    paddingTop: spacing(8),
    paddingHorizontal: spacing(3),
    paddingBottom: spacing(3)
  },
  profilePicture: {
    position: 'absolute',
    top: 37,
    left: 11,
    zIndex: 100
  }
}))

type ProfileHeaderProps = {
  scrollY: Animated.Value
}

export const ProfileHeader = (props: ProfileHeaderProps) => {
  const { scrollY } = props
  const styles = useStyles()
  const profile = useSelectProfileRoot(['user_id', 'does_current_user_follow'])
  const accountId = useSelectorWeb(getUserId)
  const isOwner = profile?.user_id === accountId
  const [hasUserFollowed, setHasUserFollowed] = useToggle(false)

  const handleFollow = useCallback(() => {
    if (!profile?.does_current_user_follow) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      setHasUserFollowed(true)
    }
  }, [setHasUserFollowed, profile])

  const handleCloseArtistRecs = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setHasUserFollowed(false)
  }, [setHasUserFollowed])

  return (
    // Box-none gets us scrolling on the non-touchable parts of the header
    // See scroll on header documentation:
    // https://github.com/PedroBern/react-native-collapsible-tab-view/tree/v2#scroll-on-header
    // And also known drawbacks:
    // https://github.com/PedroBern/react-native-collapsible-tab-view/pull/30
    <>
      <CoverPhoto scrollY={scrollY} />
      <ProfilePicture style={styles.profilePicture} />
      <View pointerEvents='box-none' style={styles.header}>
        <ProfileInfo onFollow={handleFollow} />
        <ProfileMetrics />
        <ProfileSocials />
        <ExpandableBio />
        {!hasUserFollowed ? null : (
          <ArtistRecommendations onClose={handleCloseArtistRecs} />
        )}
        {isOwner ? <UploadTrackButton /> : null}
      </View>
    </>
  )
}
