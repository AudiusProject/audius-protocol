import { useCallback } from 'react'

import { getUserId } from 'audius-client/src/common/store/account/selectors'
import type { Animated } from 'react-native'
import { LayoutAnimation, View } from 'react-native'
import { useToggle } from 'react-use'

import { Divider } from 'app/components/core'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'

import { ArtistRecommendations } from '../ArtistRecommendations'
import { CoverPhoto } from '../CoverPhoto'
import { ProfileInfo } from '../ProfileInfo'
import { ProfileMetrics } from '../ProfileMetrics'
import { ProfilePicture } from '../ProfilePicture'
import { TipAudioButton } from '../TipAudioButton'
import { UploadTrackButton } from '../UploadTrackButton'
import { useSelectProfileRoot } from '../selectors'

import { CollapsedSection } from './CollapsedSection'
import { ExpandHeaderToggleButton } from './ExpandHeaderToggleButton'
import { ExpandedSection } from './ExpandedSection'
import { TopSupporters } from './TopSupporters'

const useStyles = makeStyles(({ palette, spacing }) => ({
  header: {
    backgroundColor: palette.white,
    paddingTop: spacing(8),
    paddingHorizontal: spacing(3)
  },
  profilePicture: {
    position: 'absolute',
    top: 37,
    left: 11,
    zIndex: 100
  },
  divider: { marginHorizontal: -12, marginBottom: spacing(2) },
  bottomDivider: { marginTop: spacing(2), marginHorizontal: -12 }
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
  const [isExpanded, setIsExpanded] = useToggle(false)

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

  const handleToggleExpand = useCallback(() => {
    setIsExpanded(!isExpanded)
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
  }, [isExpanded, setIsExpanded])

  return (
    <>
      <CoverPhoto scrollY={scrollY} />
      <ProfilePicture style={styles.profilePicture} />
      <View pointerEvents='box-none' style={styles.header}>
        <ProfileInfo onFollow={handleFollow} />
        <ProfileMetrics />
        {isExpanded ? <ExpandedSection /> : <CollapsedSection />}
        <ExpandHeaderToggleButton
          isExpanded={isExpanded}
          onPress={handleToggleExpand}
        />
        <Divider style={styles.divider} />
        {!hasUserFollowed ? null : (
          <ArtistRecommendations onClose={handleCloseArtistRecs} />
        )}
        {isOwner ? <UploadTrackButton /> : <TipAudioButton />}
        <TopSupporters />
        <Divider style={styles.bottomDivider} />
      </View>
    </>
  )
}
