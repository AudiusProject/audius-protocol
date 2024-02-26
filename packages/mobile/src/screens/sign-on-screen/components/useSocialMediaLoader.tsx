import { useCallback, useEffect, useState } from 'react'

import { useDispatch } from 'react-redux'
import type { AnyAction } from 'redux'

import { IconClose } from '@audius/harmony-native'
import { useScreenOptions } from 'app/app/navigation'

export const useSocialMediaLoader = ({
  linkedSocialOnThisPagePreviously,
  resetAction
}: {
  linkedSocialOnThisPagePreviously: boolean
  resetAction: () => AnyAction
}) => {
  const dispatch = useDispatch()
  const [isWaitingForSocialLogin, setIsWaitingForSocialLogin] = useState(false)
  const [openTimeout, setOpenTimeout] = useState<
    ReturnType<typeof setTimeout> | undefined
  >(undefined)

  const { updateOptions: updateScreenOptions } = useScreenOptions()

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
    // Without this setTimeout, the header just "disappears"
    // My suspicion is this is something related to animations
    setTimeout(() => updateScreenOptions(undefined), 0)
    if (openTimeout) {
      clearTimeout(openTimeout)
    }
  }, [openTimeout, updateScreenOptions])

  const handleStartSocialMediaLogin = useCallback(() => {
    // NOTE: this cannot go inside the timeout or it will cause the header to just disappear
    updateScreenOptions({
      headerLeft: () => (
        <IconClose
          color='subdued'
          onPress={() => {
            setIsWaitingForSocialLogin(false)
          }}
        />
      )
    })
    // Set a delay for showing the social media loading screen
    // so we avoid it "flashing" right as the webview is popping up
    const timeoutId = setTimeout(() => {
      setIsWaitingForSocialLogin(true)
    }, 1500)
    setOpenTimeout(timeoutId)
  }, [updateScreenOptions])

  const handleErrorSocialMediaLogin = useCallback(() => {
    setIsWaitingForSocialLogin(false)
    // Without this setTimeout, the header just "disappears"
    // My suspicion is this is something related to animations
    setTimeout(() => updateScreenOptions(undefined), 0)
    if (openTimeout) {
      clearTimeout(openTimeout)
    }
  }, [openTimeout, updateScreenOptions])

  return {
    isWaitingForSocialLogin,
    handleStartSocialMediaLogin,
    handleErrorSocialMediaLogin,
    handleCloseSocialMediaLogin,
    setIsWaitingForSocialLogin
  }
}
