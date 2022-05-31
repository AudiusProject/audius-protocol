import { useCallback } from 'react'

import { getUserId } from 'audius-client/src/common/store/account/selectors'
import { Animated, LayoutAnimation, View } from 'react-native'
import { useToggle } from 'react-use'

import IconCaretDown from 'app/assets/images/iconCaretDown.svg'
import { Divider, TextButton } from 'app/components/core'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'

import { ArtistRecommendations } from '../ArtistRecommendations'
import { CoverPhoto } from '../CoverPhoto'
import { ProfileInfo } from '../ProfileInfo'
import { ProfileMetrics } from '../ProfileMetrics'
import { ProfilePicture } from '../ProfilePicture'
import { TipArtistButton } from '../TipArtistButton'
import { UploadTrackButton } from '../UploadTrackButton'
import { useSelectProfileRoot } from '../selectors'

import { CollapsedSection } from './CollapsedSection'
import { ExpandedSection } from './ExpandedSection'

const messages = {
  seeMore: 'See More',
  seeLess: 'See Less'
}

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
  },
  expandButton: {
    width: '100%',
    justifyContent: 'center',
    marginVertical: spacing(3)
  },
  seeLessIcon: {
    transform: [{ rotate: '180deg' }]
  },
  divider: { marginHorizontal: -12, marginBottom: 8 }
}))

type ProfileHeaderV2Props = {
  scrollY: Animated.Value
}

export const ProfileHeaderV2 = (props: ProfileHeaderV2Props) => {
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
        <TextButton
          variant='neutralLight4'
          title={isExpanded ? messages.seeLess : messages.seeMore}
          icon={IconCaretDown}
          iconPosition='right'
          IconProps={{ height: 12, width: 12 }}
          TextProps={{ fontSize: 'small', weight: 'bold' }}
          onPress={handleToggleExpand}
          styles={{
            root: styles.expandButton,
            icon: isExpanded && styles.seeLessIcon
          }}
        />
        <Divider style={styles.divider} />
        {!hasUserFollowed ? null : (
          <ArtistRecommendations onClose={handleCloseArtistRecs} />
        )}
        {isOwner ? <UploadTrackButton /> : <TipArtistButton />}
      </View>
    </>
  )
}
