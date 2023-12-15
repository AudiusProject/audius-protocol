import type { ReactElement } from 'react'

import type { TikTokProfile } from '@audius/common'
import { Name } from '@audius/common'
import { css } from '@emotion/native'
import { make } from 'common/store/analytics/actions'
import { useDispatch } from 'react-redux'

import { TikTokAuthButton } from 'app/components/tiktok-auth/TikTokAuthButton'

import { useSetProfileFromTikTok } from './socialMediaLogin'

type SignupFlowTikTokAuthProps = {
  onStart: () => void
  onFailure: (e: unknown) => void
  onSuccess: (info: {
    requiresReview: boolean
    handle: string
    platform: 'tiktok'
  }) => void
  children?: ReactElement
}

export const SignupFlowTikTokAuth = ({
  onStart,
  onFailure,
  onSuccess,
  children
}: SignupFlowTikTokAuthProps) => {
  const dispatch = useDispatch()

  const setProfileFromTikTok = useSetProfileFromTikTok()

  const handleError = (e: unknown) => {
    console.error(e)
    onFailure(e)
  }

  const handleTikTokLogin = async ({
    uuid,
    profile
  }: {
    uuid: string
    profile: TikTokProfile
  }) => {
    let res
    try {
      // res = await setProfileFromTikTok({ uuid, tikTokProfile: profile })
      // const { profile, profileImage, requiresUserReview } =
      //   await formatTikTokProfile(profile, async (image: File) => image)
      // // dispatch(
      // //   oauthActions.setTikTokInfo(
      // //     tikTokProfile.open_id,
      // //     profile,
      // //     profileImage,
      // //     requiresUserReview
      // //   )
      // // )
    } catch (e) {
      handleError(e)
      return
    }
    onSuccess({
      requiresReview: res.requiresReview,
      handle: res.handle,
      platform: 'tiktok'
    })
  }

  return (
    <TikTokAuthButton
      onPress={() => {
        onStart()
        dispatch(make(Name.CREATE_ACCOUNT_COMPLETE_TIKTOK, {}))
      }}
      title='Sign Up with TikTok'
      noText
      style={css({ flex: 1 })}
    >
      {children}
    </TikTokAuthButton>
  )
}
