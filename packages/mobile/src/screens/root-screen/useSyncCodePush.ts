import { useCallback, useRef, useState } from 'react'

import { playerSelectors } from '@audius/common/store'
import codePush from 'react-native-code-push'
import { useSelector } from 'react-redux'
import { useEffectOnce } from 'react-use'

import { useEnterBackground, useEnterForeground } from 'app/hooks/useAppState'

const { getPlaying } = playerSelectors

export const useSyncCodePush = () => {
  const [
    isPendingMandatoryCodePushUpdate,
    setIsPendingMandatoryCodePushUpdate
  ] = useState(false)

  const playing = useSelector(getPlaying)
  const timeLastBackgrounded = useRef<number | null>(null)

  const codePushSync = useCallback(() => {
    codePush.sync(
      {
        installMode: codePush.InstallMode.ON_NEXT_RESTART,
        mandatoryInstallMode: codePush.InstallMode.ON_NEXT_RESTART,
        // ^ We'll manually show the mandatory update UI and prompt the user to restart the app.
        rollbackRetryOptions: {
          delayInHours: 0.5,
          maxRetryAttempts: 5
        }
      },
      (newStatus) => {
        console.info('New CodePush Status: ', newStatus)
        codePush.getUpdateMetadata(codePush.UpdateState.PENDING).then((res) => {
          if (res != null && res.isMandatory) {
            // If there's a pending (downloaded but not yet installed) update, and it's mandatory, show the mandatory update UI
            setIsPendingMandatoryCodePushUpdate(true)
          } else if (
            res !== null &&
            !playing &&
            timeLastBackgrounded.current != null
          ) {
            // If there's a pending update and it's not mandatory, and the user backgrounded the app for over an hour and came back, and the user is NOT playing music, restart the app to apply the new update
            const time = new Date().getTime() / 1000
            if (time - timeLastBackgrounded.current > 3600) {
              codePush.restartApp(true)
            }
          }
          timeLastBackgrounded.current = null
        })
      }
    )
  }, [playing])

  useEffectOnce(() => {
    codePushSync()
  })

  useEnterForeground(() => {
    codePushSync()
  })

  useEnterBackground(() => {
    timeLastBackgrounded.current = new Date().getTime() / 1000
  })

  return { isPendingMandatoryCodePushUpdate }
}
