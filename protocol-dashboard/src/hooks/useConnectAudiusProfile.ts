import { OAUTH_URL } from '@audius/sdk'
import { useQueryClient } from '@tanstack/react-query'
import { getDashboardWalletUserQueryKey } from 'hooks/useDashboardWalletUsers'
import { useEffect } from 'react'
import { audiusSdk } from 'services/Audius/sdk'

const env = import.meta.env.VITE_ENVIRONMENT

let resolveUserHandle = null
let receiveUserHandlePromise = null

const receiveUserId = async (event: MessageEvent) => {
  const sdk = await audiusSdk()
  const oauthOrigin = new URL(OAUTH_URL[env]).origin
  if (
    event.origin !== oauthOrigin ||
    event.source !== sdk.oauth.activePopupWindow ||
    !event.data.state
  ) {
    return
  }
  if (sdk.oauth.getCsrfToken() !== event.data.state) {
    console.error('State mismatch.')
    return
  }
  if (event.data.userHandle != null) {
    resolveUserHandle(event.data.userHandle)
  }
}

export const useConnectAudiusProfile = (wallet: string) => {
  const queryClient = useQueryClient()

  const handleSuccess = async profile => {
    window.removeEventListener('message', receiveUserId)
    const sdk = await audiusSdk()

    // Optimistically set user
    await queryClient.cancelQueries({
      queryKey: getDashboardWalletUserQueryKey(wallet)
    })
    try {
      const audiusUser = await sdk.users.getUser({ id: profile.userId })
      if (audiusUser?.data) {
        queryClient.setQueryData(getDashboardWalletUserQueryKey(wallet), {
          wallet,
          user: audiusUser.data
        })
      }
    } catch {
      console.error("Couldn't fetch Audius profile data.")
    }
  }

  const loadOauth = async () => {
    const sdk = await audiusSdk()
    sdk.oauth.init({
      env: env === 'production' ? 'production' : 'staging',
      successCallback: handleSuccess,
      errorCallback: (errorMessage: string) => {
        window.removeEventListener('message', receiveUserId)
        console.error(errorMessage)
      }
    })
  }

  const loginWithAudius = async () => {
    window.removeEventListener('message', receiveUserId)
    receiveUserHandlePromise = new Promise(resolve => {
      resolveUserHandle = resolve
    })
    window.addEventListener('message', receiveUserId, false)
    const sdk = await audiusSdk()
    sdk.oauth.login({
      scope: 'write_once',
      params: {
        tx: 'connect_dashboard_wallet',
        wallet
      }
    })

    // Leg 1: Receive Audius user id from OAuth popup
    const userHandle = await receiveUserHandlePromise
    // Sign wallet signature from EM transaction
    const message = `Connecting Audius user @${userHandle} at ${Math.round(
      new Date().getTime() / 1000
    )}`
    const signature = await window.audiusLibs.web3Manager.sign(message)

    const walletSignature = { message, signature }
    // Leg 2: Send wallet signature to OAuth popup
    sdk.oauth.activePopupWindow.postMessage(
      { state: sdk.oauth.getCsrfToken(), walletSignature },
      new URL(OAUTH_URL[env]).origin
    )
  }

  useEffect(() => {
    loadOauth()
  }, [])

  return loginWithAudius
}
