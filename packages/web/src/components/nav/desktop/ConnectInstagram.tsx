import { useCallback } from 'react'

import { useUpdateProfile } from '@audius/common/api'
import { InstagramProfile, accountSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import InstagramAuth from 'components/instagram-auth/InstagramAuth'
import { useSocialMediaLoader } from 'pages/sign-up-page/hooks/useSocialMediaLoader'

const messages = {
  connect: 'Connect Instagram Profile'
}

export const ConnectInstagram = () => {
  const account = useSelector(accountSelectors.getAccountUser)

  const { mutate: updateProfile } = useUpdateProfile()

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
      if (account) {
        updateProfile({
          ...account,
          name: profile.full_name ?? account.name
        })
      }
    },
    [account, updateProfile]
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
