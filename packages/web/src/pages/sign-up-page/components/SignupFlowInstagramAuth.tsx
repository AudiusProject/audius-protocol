import { PropsWithChildren } from 'react'

import { InstagramProfile, Name } from '@audius/common'
import { useDispatch } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import InstagramAuth from 'components/instagram-auth/InstagramAuth'

import { useSetProfileFromInstagram } from '../hooks/socialMediaLogin'

type SignupFlowInstagramAuthProps = PropsWithChildren<{
  className?: string
  onFailure: (e: unknown) => void
  onSuccess: (info: {
    requiresReview: boolean
    handle: string
    platform: 'instagram'
  }) => void
  onStart: () => void
}>

export const SignupFlowInstagramAuth = ({
  className,
  onStart,
  onFailure,
  onSuccess,
  children
}: SignupFlowInstagramAuthProps) => {
  const dispatch = useDispatch()

  const setProfileFromInstagram = useSetProfileFromInstagram()

  const handleError = (e: unknown) => {
    console.error(e)
    onFailure(e)
  }

  const handleInstagramLogin = async ({
    uuid,
    profile
  }: {
    uuid: string
    profile: InstagramProfile
  }) => {
    let res
    try {
      res = await setProfileFromInstagram({ uuid, instagramProfile: profile })
    } catch (e) {
      handleError(e)
      return
    }
    onSuccess({
      requiresReview: res.requiresReview,
      handle: res.handle,
      platform: 'instagram'
    })
  }

  return (
    <InstagramAuth
      className={className}
      onClick={() => {
        onStart()
        dispatch(make(Name.CREATE_ACCOUNT_START_INSTAGRAM, {}))
      }}
      onFailure={handleError}
      onSuccess={(uuid, profile) => handleInstagramLogin({ uuid, profile })}
    >
      {children}
    </InstagramAuth>
  )
}
