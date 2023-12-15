import {
  formatInstagramProfile,
  formatTikTokProfile,
  formatTwitterProfile,
  Name,
  pickHandleSchema,
  useAudiusQueryContext
} from '@audius/common'
import type {
  InstagramProfile,
  TikTokProfile,
  TwitterProfile
} from '@audius/common'
import { make } from 'common/store/analytics/actions'
import {
  setInstagramProfile,
  setTikTokProfile,
  setTwitterProfile
} from 'common/store/pages/signon/actions'
import { useDispatch } from 'react-redux'
import { resizeImage } from 'utils/imageProcessingUtil'
import { restrictedHandles } from 'utils/restrictedHandles'

const GENERAL_ADMISSION = process.env.VITE_GENERAL_ADMISSION ?? ''

export const useSetProfileFromTwitter = () => {
  const dispatch = useDispatch()
  const audiusQueryContext = useAudiusQueryContext()

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
      audiusQueryContext: audiusQueryContext!,
      skipReservedHandleCheck: profile.verified,
      restrictedHandles
    })

    const validationResult = await handleSchema.safeParseAsync(
      profile.screen_name
    )

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
  const audiusQueryContext = useAudiusQueryContext()

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
      audiusQueryContext: audiusQueryContext!,
      skipReservedHandleCheck: profile.is_verified,
      restrictedHandles
    })

    const validationResult = await handleSchema.safeParseAsync(profile.username)

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
  const audiusQueryContext = useAudiusQueryContext()

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
      audiusQueryContext: audiusQueryContext!,
      skipReservedHandleCheck: profile.is_verified,
      restrictedHandles
    })

    const validationResult = await handleSchema.safeParseAsync(profile.username)

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
