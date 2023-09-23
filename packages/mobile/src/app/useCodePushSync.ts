import { useCallback, useState } from 'react'

import codePush from 'react-native-code-push'
import { useEffectOnce } from 'react-use'

import { useEnterForeground } from 'app/hooks/useAppState'

export const useCodePushSync = () => {
  const [
    isPendingMandatoryCodePushUpdate,
    setIsPendingMandatoryCodePushUpdate
  ] = useState(false)

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
            setIsPendingMandatoryCodePushUpdate(true)
          }
        })
      }
    )
  }, [])

  useEffectOnce(() => {
    codePushSync()
  })

  useEnterForeground(() => {
    codePushSync()
  })

  return { isPendingMandatoryCodePushUpdate }
}
