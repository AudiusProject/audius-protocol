import { useCallback, useEffect, useState } from 'react'

import { Name } from '@audius/common/models'

import {} from '@audius/common'
import { useDispatch } from 'react-redux'
import { AnyAction } from 'redux'

import { make } from 'common/store/analytics/actions'

import { SocialPlatform } from '../components/SocialMediaLoginOptions'

export const useSocialMediaLoader = ({
  linkedSocialOnThisPagePreviously,
  resetAction,
  page
}: {
  linkedSocialOnThisPagePreviously: boolean
  resetAction: () => AnyAction
  page: 'create-email' | 'pick-handle'
}) => {
  const dispatch = useDispatch()
  const [isWaitingForSocialLogin, setIsWaitingForSocialLogin] = useState(false)

  useEffect(() => {
    // If the user goes back to this page in the middle of the flow after they linked
    // their social on this page previously, clear the sign on state.
    if (linkedSocialOnThisPagePreviously) {
      dispatch(resetAction())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch])

  const handleStartSocialMediaLogin = useCallback(
    (platform: SocialPlatform) => {
      setIsWaitingForSocialLogin(true)
      if (platform === 'instagram') {
        dispatch(make(Name.CREATE_ACCOUNT_START_INSTAGRAM, { page }))
      }
      if (platform === 'twitter') {
        dispatch(make(Name.CREATE_ACCOUNT_START_TWITTER, { page }))
      }
      if (platform === 'tiktok') {
        dispatch(make(Name.CREATE_ACCOUNT_START_TIKTOK, { page }))
      }
    },
    [dispatch, page]
  )

  const handleErrorSocialMediaLogin = useCallback(
    (error: Error, platform: SocialPlatform) => {
      // We track the user closes differently since these arent technically "system errors"
      const isUserClose = error.message?.includes(
        'Popup has been closed by user'
      )

      if (platform === 'instagram') {
        if (isUserClose) {
          dispatch(make(Name.CREATE_ACCOUNT_CLOSED_INSTAGRAM, { page }))
        } else {
          dispatch(
            make(Name.CREATE_ACCOUNT_INSTAGRAM_ERROR, {
              page,
              error: error?.message ?? 'Unknown Error'
            })
          )
        }
      }
      if (platform === 'twitter') {
        if (isUserClose) {
          dispatch(make(Name.CREATE_ACCOUNT_CLOSED_TWITTER, { page }))
        } else {
          dispatch(
            make(Name.CREATE_ACCOUNT_TWITTER_ERROR, {
              page,
              error: error?.message ?? 'Unknown Error'
            })
          )
        }
      }
      if (platform === 'tiktok') {
        if (isUserClose) {
          dispatch(make(Name.CREATE_ACCOUNT_CLOSED_TIKTOK, { page }))
        } else {
          dispatch(
            make(Name.CREATE_ACCOUNT_TIKTOK_ERROR, {
              page,
              error: error?.message ?? 'Unknown Error'
            })
          )
        }
      }

      setIsWaitingForSocialLogin(false)
    },
    [dispatch, page]
  )

  return {
    isWaitingForSocialLogin,
    handleStartSocialMediaLogin,
    handleErrorSocialMediaLogin
  }
}
