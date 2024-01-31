import { memo, useCallback, useEffect, useState } from 'react'

import { accountSelectors, useSelectTierInfo } from '@audius/common'
import { css } from '@emotion/native'
import type { Animated } from 'react-native'
import { LayoutAnimation, View } from 'react-native'
import { useSelector } from 'react-redux'
import { useToggle } from 'react-use'

import { Box, useTheme } from '@audius/harmony-native'
import { Divider, ProfilePicture } from 'app/components/core'
import { OnlineOnly } from 'app/components/offline-placeholder/OnlineOnly'
import { makeStyles } from 'app/styles'
import { zIndex } from 'app/utils/zIndex'

import { ArtistRecommendations } from '../ArtistRecommendations'
import { ProfileCoverPhoto } from '../ProfileCoverPhoto'
import { ProfileInfo } from '../ProfileInfo'
import { ProfileMetrics } from '../ProfileMetrics'
import { TipAudioButton } from '../TipAudioButton'
import { UploadTrackButton } from '../UploadTrackButton'
import { useSelectProfile } from '../selectors'

import { CollapsedSection } from './CollapsedSection'
import { ExpandHeaderToggleButton } from './ExpandHeaderToggleButton'
import { ExpandedSection } from './ExpandedSection'
import { TopSupporters } from './TopSupporters'
const getUserId = accountSelectors.getUserId

const useStyles = makeStyles(({ palette, spacing }) => ({
  header: {
    backgroundColor: palette.white,
    paddingTop: spacing(2),
    paddingHorizontal: spacing(3)
  },
  divider: { marginHorizontal: -12, marginBottom: spacing(2) },
  bottomDivider: { marginTop: spacing(2), marginHorizontal: -12 }
}))

type ProfileHeaderProps = {
  scrollY: Animated.Value
}
// Memoized since material-top-tabs triggers unecessary rerenders
export const ProfileHeader = memo((props: ProfileHeaderProps) => {
  const { scrollY } = props
  const styles = useStyles()
  const accountId = useSelector(getUserId)
  const [hasUserFollowed, setHasUserFollowed] = useToggle(false)
  const [isExpanded, setIsExpanded] = useToggle(false)
  const [isExpansible, setIsExpansible] = useState(false)

  const {
    user_id: userId,
    does_current_user_follow: doesCurrentUserFollow,
    current_user_followee_follow_count: currentUserFolloweeFollowCount,
    website,
    donation,
    twitter_handle: twitterHandle,
    instagram_handle: instagramHandle,
    tiktok_handle: tikTokHandle,
    supporting_count: supportingCount,
    allow_ai_attribution
  } = useSelectProfile([
    'user_id',
    'does_current_user_follow',
    'current_user_followee_follow_count',
    'website',
    'donation',
    'twitter_handle',
    'instagram_handle',
    'tiktok_handle',
    'supporting_count',
    'allow_ai_attribution'
  ])

  const { tier = 'none' } = useSelectTierInfo(userId)
  const hasTier = tier !== 'none'
  const isOwner = userId === accountId
  const hasMutuals = !isOwner && currentUserFolloweeFollowCount > 0
  const hasMultipleSocials =
    [website, donation, twitterHandle, instagramHandle, tikTokHandle].filter(
      Boolean
    ).length > 1
  const isSupporting = supportingCount > 0
  // Note: we also if the profile bio is longer than 3 lines, but that's handled in the Bio component.
  const shouldExpand =
    hasTier ||
    hasMutuals ||
    hasMultipleSocials ||
    isSupporting ||
    allow_ai_attribution

  useEffect(() => {
    if (!isExpansible && shouldExpand) {
      setIsExpansible(true)
    }
  }, [shouldExpand, isExpansible, setIsExpansible])

  const handleFollow = useCallback(() => {
    if (!doesCurrentUserFollow) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      setHasUserFollowed(true)
    }
  }, [setHasUserFollowed, doesCurrentUserFollow])

  const handleCloseArtistRecs = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setHasUserFollowed(false)
  }, [setHasUserFollowed])

  const handleToggleExpand = useCallback(() => {
    setIsExpanded(!isExpanded)
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
  }, [isExpanded, setIsExpanded])

  const { spacing } = useTheme()

  return (
    <>
      <ProfileCoverPhoto scrollY={scrollY} />
      <Box
        style={css({
          position: 'absolute',
          top: spacing.unit13,
          left: spacing.unit3,
          zIndex: zIndex.PROFILE_PAGE_PROFILE_PICTURE
        })}
        pointerEvents='none'
      >
        <ProfilePicture userId={userId} size='xl' />
      </Box>
      <View pointerEvents='box-none' style={styles.header}>
        <ProfileInfo onFollow={handleFollow} />
        <OnlineOnly>
          <ProfileMetrics />
          {isExpanded ? (
            <ExpandedSection />
          ) : (
            <CollapsedSection
              isExpansible={isExpansible}
              setIsExpansible={setIsExpansible}
            />
          )}
          {isExpansible ? (
            <ExpandHeaderToggleButton
              isExpanded={isExpanded}
              onPress={handleToggleExpand}
            />
          ) : null}
          <Divider style={styles.divider} />
          {!hasUserFollowed ? null : (
            <ArtistRecommendations onClose={handleCloseArtistRecs} />
          )}
          {isOwner ? <UploadTrackButton /> : <TipAudioButton />}
          <TopSupporters />
        </OnlineOnly>
        <Divider style={styles.bottomDivider} />
      </View>
    </>
  )
})
