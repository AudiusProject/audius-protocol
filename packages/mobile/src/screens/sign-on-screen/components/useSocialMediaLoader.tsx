import { useCallback, useEffect, useState } from 'react'

import { useDispatch } from 'react-redux'
import type { AnyAction } from 'redux'

import { setCredentials } from 'app/store/oauth/actions'

export const useSocialMediaLoader = ({
  linkedSocialOnThisPagePreviously,
  resetAction
}: {
  linkedSocialOnThisPagePreviously: boolean
  resetAction: () => AnyAction
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

  const handleCloseSocialMediaLogin = useCallback(() => {
    setIsWaitingForSocialLogin(false)
  }, [])

  const handleStartSocialMediaLogin = useCallback(() => {
    setIsWaitingForSocialLogin(true)
  }, [])

  const handleErrorSocialMediaLogin = useCallback(() => {
    setIsWaitingForSocialLogin(false)
  }, [])

  return {
    isWaitingForSocialLogin,
    handleStartSocialMediaLogin,
    handleErrorSocialMediaLogin,
    handleCloseSocialMediaLogin,
    setIsWaitingForSocialLogin
  }
}
