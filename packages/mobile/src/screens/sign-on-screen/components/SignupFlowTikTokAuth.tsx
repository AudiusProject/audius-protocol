import { useEffect } from 'react'

import {
  useAudiusQueryContext,
  type TikTokProfileData,
  pickHandleSchema,
  Name
} from '@audius/common'
import { useDispatch, useSelector } from 'react-redux'
import { restrictedHandles } from 'utils/restrictedHandles'

import { TikTokAuthButton } from 'app/components/tiktok-auth'
import { make, track } from 'app/services/analytics'
import * as oauthActions from 'app/store/oauth/actions'
import { getAbandoned } from 'app/store/oauth/selectors'

type SignupFlowTikTokAuthProps = {
  onStart: () => void
  onFailure: (e: unknown) => void
  onSuccess: (info: {
    requiresReview: boolean
    handle: string
    platform: 'tiktok'
  }) => void
  onClose: () => void
}

// Wrapper around TikTokAuthButton that
export const SignUpFlowTikTokAuth = ({
  onStart,
  onSuccess,
  onFailure,
  onClose
}: SignupFlowTikTokAuthProps) => {
  const dispatch = useDispatch()
  const abandoned = useSelector(getAbandoned)
  const audiusQueryContext = useAudiusQueryContext()

  useEffect(() => {
    if (abandoned) {
      onClose()
    }
  }, [abandoned, onClose])

  const handleSuccess = async ({
    profileData
  }: {
    profileData: TikTokProfileData
  }) => {
    try {
      const { profile, handleTooLong } = profileData
      const handleSchema = pickHandleSchema({
        audiusQueryContext: audiusQueryContext!,
        skipReservedHandleCheck: profile.is_verified,
        restrictedHandles
      })
      const validationResult = await handleSchema.safeParseAsync({
        handle: profile.username
      })
      const requiresReview = !handleTooLong && !validationResult.success

      track(
        make({
          eventName: Name.CREATE_ACCOUNT_COMPLETE_TIKTOK,
          isVerified: !!profile.is_verified,
          handle: profile.username || 'unknown'
        })
      )
      onSuccess({
        requiresReview,
        handle: profile.username,
        platform: 'tiktok'
      })
    } catch (e) {
      onFailure(e)
    }
  }

  const handlePress = () => {
    onStart()
    dispatch(oauthActions.setTikTokError(null))
  }

  return (
    <TikTokAuthButton
      onPress={handlePress}
      onError={onFailure}
      onSuccess={handleSuccess}
      onClose={onClose}
      style={{ flex: 1 }}
      noText
    />
  )
}
