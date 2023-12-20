import {
  useAudiusQueryContext,
  type TikTokProfileData,
  pickHandleSchema
} from '@audius/common'
import { useDispatch } from 'react-redux'
import { restrictedHandles } from 'utils/restrictedHandles'

import { TikTokAuthButton } from 'app/components/tiktok-auth'
import { make, track } from 'app/services/analytics'
import * as oauthActions from 'app/store/oauth/actions'
import { EventNames } from 'app/types/analytics'

type SignupFlowTikTokAuthProps = {
  onStart: () => void
  onFailure: (e: unknown) => void
  onSuccess: (info: {
    requiresReview: boolean
    handle: string
    platform: 'tiktok'
  }) => void
}

export const SignUpFlowTikTokAuth = ({
  onStart,
  onSuccess,
  onFailure
}: SignupFlowTikTokAuthProps) => {
  const dispatch = useDispatch()
  const audiusQueryContext = useAudiusQueryContext()

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

      // TODO: connect this analytics thingy
      //   dispatch(
      //     make({
      //       eventName: Name.CREATE_ACCOUNT_COMPLETE_TIKTOK,
      //       isVerified: !!profile.is_verified,
      //       handle: profile.username || 'unknown'
      //     })
      //   )
      onSuccess({
        requiresReview,
        handle: profile.username,
        platform: 'tiktok'
      })
    } catch (e) {
      console.error(e)
      onFailure(e)
    }
  }

  const handlePress = () => () => {
    onStart()
    track(
      make({
        eventName: EventNames.CREATE_ACCOUNT_START_TIKTOK
      })
    )
    dispatch(oauthActions.setTikTokError(null))
  }

  return (
    <TikTokAuthButton
      onPress={handlePress}
      onError={onFailure}
      onSuccess={handleSuccess}
      style={{ flex: 1 }}
      noText
    />
  )
}
