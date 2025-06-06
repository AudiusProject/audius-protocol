import { useQueryContext } from '@audius/common/api'
import { Name } from '@audius/common/models'
import { pickHandleSchema } from '@audius/common/schemas'
import {
  formatTwitterProfile,
  formatInstagramProfile,
  formatTikTokProfile
} from '@audius/common/services'
import {
  InstagramProfile,
  TwitterProfile,
  TikTokProfile
} from '@audius/common/store'
import { useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import {
  setInstagramProfile,
  setTikTokProfile,
  setTwitterProfile
} from 'common/store/pages/signon/actions'
import { env } from 'services/env'
import { resizeImage } from 'utils/imageProcessingUtil'
import { restrictedHandles } from 'utils/restrictedHandles'

const GENERAL_ADMISSION = env.GENERAL_ADMISSION ?? ''

export const useSetProfileFromTwitter = () => {
  const dispatch = useDispatch()
  const queryContext = useQueryContext()
  const queryClient = useQueryClient()

  return async ({
    uuid,
    twitterProfile
  }: {
    uuid: string
    twitterProfile: TwitterProfile
  }) => {
    const profileData = await formatTwitterProfile(twitterProfile, resizeImage)

    const { profile, profileImage, profileBanner, handleTooLong } = profileData

    const handleSchema = pickHandleSchema({
      queryContext,
      queryClient,
      skipReservedHandleCheck: profile.verified,
      restrictedHandles
    })

    const validationResult = await handleSchema.safeParseAsync({
      handle: profile.screen_name
    })

    const requiresReview = !handleTooLong && !validationResult.success
    dispatch(setTwitterProfile(uuid, profile, profileImage, profileBanner))
    dispatch(
      make(Name.CREATE_ACCOUNT_COMPLETE_TWITTER, {
        isVerified: !!profile.verified,
        handle: profile.screen_name || 'unknown'
      })
    )
    return { requiresReview, handle: profile.screen_name }
  }
}

export const useSetProfileFromInstagram = () => {
  const dispatch = useDispatch()
  const queryContext = useQueryContext()
  const queryClient = useQueryClient()

  return async ({
    uuid,
    instagramProfile
  }: {
    uuid: string
    instagramProfile: InstagramProfile
  }) => {
    const profileData = await formatInstagramProfile(
      instagramProfile,
      GENERAL_ADMISSION,
      resizeImage
    )

    const { profile, profileImage, handleTooLong } = profileData
    const handleSchema = pickHandleSchema({
      queryContext,
      queryClient,
      skipReservedHandleCheck: profile.is_verified,
      restrictedHandles
    })

    const validationResult = await handleSchema.safeParseAsync({
      handle: profile.username
    })

    const requiresReview = !handleTooLong && !validationResult.success

    dispatch(setInstagramProfile(uuid, profile, profileImage))
    dispatch(
      make(Name.CREATE_ACCOUNT_COMPLETE_INSTAGRAM, {
        isVerified: !!profile.is_verified,
        handle: profile.username || 'unknown'
      })
    )
    return { requiresReview, handle: profile.username }
  }
}

export const useSetProfileFromTikTok = () => {
  const dispatch = useDispatch()
  const queryContext = useQueryContext()
  const queryClient = useQueryClient()

  return async ({
    uuid,
    tikTokProfile
  }: {
    uuid: string
    tikTokProfile: TikTokProfile
  }) => {
    const profileData = await formatTikTokProfile(tikTokProfile, resizeImage)

    const { profile, profileImage, handleTooLong } = profileData
    const handleSchema = pickHandleSchema({
      queryContext,
      queryClient,
      skipReservedHandleCheck: profile.is_verified,
      restrictedHandles
    })

    const validationResult = await handleSchema.safeParseAsync({
      handle: profile.username
    })

    const requiresReview = !handleTooLong && !validationResult.success
    dispatch(setTikTokProfile(uuid, profile, profileImage))
    dispatch(
      make(Name.CREATE_ACCOUNT_COMPLETE_TIKTOK, {
        isVerified: !!profile.is_verified,
        handle: profile.username || 'unknown'
      })
    )
    return { requiresReview, handle: profile.username }
  }
}
