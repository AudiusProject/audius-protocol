import { useEffect, useState } from 'react'

import {
  pickHandleSchema,
  socialMediaMessages,
  useAudiusQueryContext
} from '@audius/common'
import * as signOnActions from 'common/store/pages/signon/actions'
import { useDispatch, useSelector } from 'react-redux'

import { make, track } from 'app/services/analytics'
import * as oauthActions from 'app/store/oauth/actions'
import type { InstagramInfo } from 'app/store/oauth/reducer'
import { getInstagramError, getInstagramInfo } from 'app/store/oauth/selectors'
import { EventNames } from 'app/types/analytics'

import { restrictedHandles } from '../utils/restrictedHandles'

import { SocialButton } from './temp-harmony/SocialButton'

type SignUpFlowInstagramAuthProps = {
  onStart: () => void
  onFailure: (e: unknown) => void
  onSuccess: (info: {
    requiresReview: boolean
    handle: string
    platform: 'instagram'
  }) => void
}

const useSetProfileFromInstagram = () => {
  const dispatch = useDispatch()
  const audiusQueryContext = useAudiusQueryContext()

  return async ({ instagramInfo }: { instagramInfo: InstagramInfo }) => {
    dispatch(
      signOnActions.setInstagramProfile(
        instagramInfo.uuid,
        instagramInfo.profile,
        instagramInfo.profile.profile_pic_url_hd
          ? {
              uri: instagramInfo.profile.profile_pic_url_hd,
              name: 'ProfileImage',
              type: 'image/jpeg'
            }
          : null
      )
    )

    const { profile } = instagramInfo
    const handleSchema = pickHandleSchema({
      audiusQueryContext: audiusQueryContext!,
      skipReservedHandleCheck: profile.is_verified,
      restrictedHandles
    })

    const validationResult = await handleSchema.safeParseAsync({
      handle: profile.username
    })

    const requiresReview = !validationResult.success
    // dispatch(
    //   make({
    //     eventName: Name.CREATE_ACCOUNT_COMPLETE_INSTAGRAM,
    //     isVerified: !!profile.verified,
    //     handle: profile.screen_name || 'unknown'
    //   })
    // )
    return {
      requiresReview,
      handle: profile.username,
      platform: 'instagram'
    }
  }
}

export const SignUpFlowInstagramAuth = ({
  onFailure,
  onSuccess,
  onStart
}: SignUpFlowInstagramAuthProps) => {
  const dispatch = useDispatch()
  const instagramInfo = useSelector(getInstagramInfo)
  const instagramError = useSelector(getInstagramError)
  const [hasNavigatedAway, setHasNavigatedAway] = useState(false)

  useEffect(() => {
    if (instagramError) {
      onFailure(instagramError)
    }
  }, [onFailure, instagramError])

  const setProfileFromInstagram = useSetProfileFromInstagram()

  useEffect(() => {
    if (hasNavigatedAway && instagramInfo) {
      setProfileFromInstagram({ instagramInfo })
        .then(onSuccess)
        .catch(onFailure)
      setHasNavigatedAway(false)
    }
  }, [
    instagramInfo,
    setProfileFromInstagram,
    onSuccess,
    onFailure,
    hasNavigatedAway
  ])

  const handlePress = () => {
    onStart?.()
    setHasNavigatedAway(true)
    dispatch(oauthActions.setInstagramError(null))
    dispatch(oauthActions.instagramAuth())
    track(
      make({
        eventName: EventNames.CREATE_ACCOUNT_START_INSTAGRAM
      })
    )
  }

  return (
    <SocialButton
      socialType='instagram'
      style={{ flex: 1, height: '100%' }}
      onPress={handlePress}
      title={socialMediaMessages.signUpInstagram}
      noText
    ></SocialButton>
  )
}
