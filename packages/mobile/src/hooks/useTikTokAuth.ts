import type { Credentials, UseTikTokAuthArguments } from '@audius/common'
import { createUseTikTokAuthHook } from '@audius/common'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Config from 'react-native-config'
import { useDispatch } from 'react-redux'

import { track, make } from 'app/services/analytics'
import * as oauthActions from 'app/store/oauth/actions'
import { Provider } from 'app/store/oauth/reducer'
import { EventNames } from 'app/types/analytics'

export const useTikTokAuth = (args: UseTikTokAuthArguments) => {
  const dispatch = useDispatch()

  return createUseTikTokAuthHook({
    authenticate: async () => {
      return new Promise<Credentials>((resolve, reject) => {
        const authenticationUrl = `${Config.IDENTITY_SERVICE}/tiktok`

        dispatch(
          oauthActions.requestNativeOpenPopup(
            resolve,
            reject,
            authenticationUrl,
            Provider.TIKTOK
          )
        )
      })
    },
    handleError: (e: Error) => {
      track(
        make({
          eventName: EventNames.TIKTOK_OAUTH_ERROR,
          error: e.message
        })
      )
    },
    getLocalStorageItem: AsyncStorage.getItem,
    setLocalStorageItem: AsyncStorage.setItem
  })(args)
}
