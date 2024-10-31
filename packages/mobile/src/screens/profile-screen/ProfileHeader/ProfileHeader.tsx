import { memo, useCallback, useEffect, useState } from 'react'

import { useSelectTierInfo } from '@audius/common/hooks'
import { accountSelectors } from '@audius/common/store'
import { css } from '@emotion/native'
import type { Animated } from 'react-native'
import { LayoutAnimation } from 'react-native'
import { useSelector } from 'react-redux'
import { useToggle } from 'react-use'

import { Box, Divider, Flex, useTheme } from '@audius/harmony-native'
import { ProfilePicture } from 'app/components/core'
import { OnlineOnly } from 'app/components/offline-placeholder/OnlineOnly'
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

type ProfileHeaderProps = {
  scrollY: Animated.Value
}

// Memoized since material-top-tabs triggers unecessary rerenders
export const ProfileHeader = memo((props: ProfileHeaderProps) => {
  const { scrollY } = props
  const accountId = useSelector(getUserId)
  const [hasUserFollowed, setHasUserFollowed] = useToggle(false)
  const [isExpanded, setIsExpanded] = useToggle(false)
  const [isExpandable, setIsExpandable] = useState(false)

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
    if (!isExpandable && shouldExpand) {
      setIsExpandable(true)
    }
  }, [shouldExpand, isExpandable, setIsExpandable])

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
      <Flex
        column
        pointerEvents='box-none'
        backgroundColor='white'
        pv='s'
        ph='m'
        gap='s'
        borderBottom='default'
      >
        <ProfileInfo onFollow={handleFollow} />
        <OnlineOnly>
          <ProfileMetrics />
          {isExpanded ? (
            <ExpandedSection />
          ) : (
            <CollapsedSection
              isExpandable={isExpandable}
              setIsExpandable={setIsExpandable}
            />
          )}
          {isExpandable ? (
            <ExpandHeaderToggleButton
              isExpanded={isExpanded}
              onPress={handleToggleExpand}
            />
          ) : null}
          <Divider mh={-12} />
          {!hasUserFollowed ? null : (
            <ArtistRecommendations onClose={handleCloseArtistRecs} />
          )}
          {isOwner ? <UploadTrackButton /> : <TipAudioButton />}
          <TopSupporters />
        </OnlineOnly>
      </Flex>
    </>
  )
})
