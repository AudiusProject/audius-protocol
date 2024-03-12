import { useCallback } from 'react'

import {
  InstagramProfile,
  accountSelectors,
  profilePageActions
} from '@audius/common/store'
import { useDispatch, useSelector } from 'react-redux'

import InstagramAuth from 'components/instagram-auth/InstagramAuth'
import { useSocialMediaLoader } from 'pages/sign-up-page/hooks/useSocialMediaLoader'

const messages = {
  connect: 'Connect Instagram Profile'
}

export const ConnectInstagram = () => {
  const dispatch = useDispatch()
  const account = useSelector(accountSelectors.getAccountUser)

  const { handleStartSocialMediaLogin, handleErrorSocialMediaLogin } =
    useSocialMediaLoader({
      linkedSocialOnThisPagePreviously: false,
      page: 'pick-handle'
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
      if (account) {
        dispatch(
          profilePageActions.updateProfile({
            ...account,
            name: profile.full_name ?? account.name
          })
        )
      }
    },
    [account, dispatch]
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
