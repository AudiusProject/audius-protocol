import { PropsWithChildren } from 'react'

import { Name, TwitterProfile } from '@audius/common'
import { useDispatch } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import TwitterAuth from 'components/twitter-auth/TwitterAuth'

import { useSetProfileFromTwitter } from '../hooks/socialMediaLogin'

type SignupFlowTwitterAuthProps = PropsWithChildren<{
  className?: string
  onFailure: (e: unknown) => void
  onSuccess: (info: {
    requiresReview: boolean
    handle: string
    platform: 'twitter'
  }) => void
  onStart: () => void
}>

export const SignupFlowTwitterAuth = ({
  className,
  onFailure,
  onSuccess,
  onStart,
  children
}: SignupFlowTwitterAuthProps) => {
  const dispatch = useDispatch()

  const setProfileFromTwitter = useSetProfileFromTwitter()

  const handleError = (e: unknown) => {
    console.error(e)
    onFailure(e)
  }

  const handleTwitterLogin = async (params: {
    uuid: string
    twitterProfile: TwitterProfile
  }) => {
    let res
    try {
      res = await setProfileFromTwitter(params)
    } catch (e) {
      handleError(e)
      return
    }
    onSuccess({
      requiresReview: res.requiresReview,
      handle: res.handle,
      platform: 'twitter'
    })
  }

  return (
    <TwitterAuth
      className={className}
      forceLogin
      onClick={() => {
        onStart()
        dispatch(make(Name.CREATE_ACCOUNT_START_TWITTER, {}))
      }}
      onFailure={handleError}
      onSuccess={(uuid, profile) =>
        handleTwitterLogin({ uuid, twitterProfile: profile })
      }
    >
      {children}
    </TwitterAuth>
  )
}
