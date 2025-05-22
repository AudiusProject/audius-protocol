import { useCallback } from 'react'

import { useCurrentAccountUser } from '@audius/common/api'
import { InstagramProfile, profilePageActions } from '@audius/common/store'
import { useDispatch } from 'react-redux'

import InstagramAuth from 'components/instagram-auth/InstagramAuth'
import { useSocialMediaLoader } from 'pages/sign-up-page/hooks/useSocialMediaLoader'

const messages = {
  connect: 'Connect Instagram Profile'
}

export const ConnectInstagram = () => {
  const dispatch = useDispatch()
  const { data: accountUser } = useCurrentAccountUser()

  const { handleStartSocialMediaLogin, handleErrorSocialMediaLogin } =
    useSocialMediaLoader({
      linkedSocialOnThisPagePreviously: false
    })

  const handleStart = useCallback(() => {
    handleStartSocialMediaLogin('instagram')
  }, [handleStartSocialMediaLogin])

  const handleError = useCallback(
    (e: Error) => {
      handleErrorSocialMediaLogin(e, 'instagram')
    },
    [handleErrorSocialMediaLogin]
  )

  const handleSuccess = useCallback(
    (uuid: string, profile: InstagramProfile) => {
      if (accountUser) {
        dispatch(
          profilePageActions.updateProfile({
            ...accountUser,
            name: profile.full_name ?? accountUser.name
          })
        )
      }
    },
    [accountUser, dispatch]
  )

  return (
    <InstagramAuth
      onClick={handleStart}
      onFailure={handleError}
      onSuccess={handleSuccess}
      text={messages.connect}
    />
  )
}
