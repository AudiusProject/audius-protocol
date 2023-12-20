import { useCallback, useEffect, useState } from 'react'

import type { TwitterProfile } from '@audius/common'
import {
  Name,
  formatTwitterProfile,
  pickHandleSchema,
  socialMediaMessages,
  useAudiusQueryContext
} from '@audius/common'
import { setTwitterProfile } from 'audius-client/src/common/store/pages/signon/actions'
import { getHandleField } from 'audius-client/src/common/store/pages/signon/selectors'
import * as signOnActions from 'common/store/pages/signon/actions'
import { useDispatch, useSelector } from 'react-redux'

import { make, track } from 'app/services/analytics'
import * as oauthActions from 'app/store/oauth/actions'
import type { TwitterInfo } from 'app/store/oauth/reducer'
import { getTwitterError, getTwitterInfo } from 'app/store/oauth/selectors'
import { EventNames } from 'app/types/analytics'

import { restrictedHandles } from '../utils/restrictedHandles'

import { SocialButton } from './temp-harmony/SocialButton'

type SignUpFlowTwitterAuthProps = {
  onStart: () => void
  onFailure: (e: unknown) => void
  onSuccess: (info: {
    requiresReview: boolean
    handle: string
    platform: 'twitter'
  }) => void
}

const useSetProfileFromTwitter = () => {
  const dispatch = useDispatch()
  const audiusQueryContext = useAudiusQueryContext()

  return async ({ twitterInfo }: { twitterInfo: TwitterInfo }) => {
    dispatch(
      signOnActions.setTwitterProfile(
        twitterInfo.uuid,
        twitterInfo.profile,
        twitterInfo.profile.profile_image_url_https
          ? {
              // Replace twitter's returned image (which may vary) with the hd one
              uri: twitterInfo.profile.profile_image_url_https.replace(
                /_(normal|bigger|mini)/g,
                ''
              ),
              name: 'ProfileImage',
              type: 'image/jpeg'
            }
          : null,
        twitterInfo.profile.profile_banner_url
          ? {
              uri: twitterInfo.profile.profile_banner_url,
              name: 'ProfileBanner',
              type: 'image/png'
            }
          : null
      )
    )

    const { profile } = twitterInfo
    const handleSchema = pickHandleSchema({
      audiusQueryContext: audiusQueryContext!,
      skipReservedHandleCheck: profile.verified,
      restrictedHandles
    })

    const validationResult = await handleSchema.safeParseAsync({
      handle: profile.screen_name
    })

    const requiresReview = !validationResult.success
    // dispatch(
    //   make({
    //     eventName: Name.CREATE_ACCOUNT_COMPLETE_TWITTER,
    //     isVerified: !!profile.verified,
    //     handle: profile.screen_name || 'unknown'
    //   })
    // )
    return { requiresReview, handle: profile.screen_name, platform: 'twitter' }
  }
}

export const SignUpFlowTwitterAuth = ({
  onFailure,
  onSuccess,
  onStart
}: SignUpFlowTwitterAuthProps) => {
  const dispatch = useDispatch()
  const twitterInfo = useSelector(getTwitterInfo)
  const twitterError = useSelector(getTwitterError)
  const [hasNavigatedAway, setHasNavigatedAway] = useState(false)

  useEffect(() => {
    if (twitterError) {
      onFailure(twitterError)
    }
  }, [onFailure, twitterError])

  const setProfileFromTwitter = useSetProfileFromTwitter()

  useEffect(() => {
    if (hasNavigatedAway && twitterInfo) {
      setProfileFromTwitter({ twitterInfo }).then(onSuccess).catch(onFailure)
      setHasNavigatedAway(false)
    }
  }, [
    twitterInfo,
    setProfileFromTwitter,
    onSuccess,
    onFailure,
    hasNavigatedAway
  ])

  const handlePress = () => {
    onStart?.()
    setHasNavigatedAway(true)
    dispatch(oauthActions.setTwitterError(null))
    dispatch(oauthActions.twitterAuth())
    track(
      make({
        eventName: EventNames.CREATE_ACCOUNT_START_TWITTER
      })
    )
  }

  return (
    <SocialButton
      socialType='twitter'
      style={{ flex: 1, height: '100%' }}
      onPress={handlePress}
      title={socialMediaMessages.signUpTwitter}
      noText
    ></SocialButton>
  )
}
