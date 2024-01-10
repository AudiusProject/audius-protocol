import { useQueryClient } from '@tanstack/react-query'
import { getDashboardWalletUserQueryKey } from 'hooks/useDashboardWalletUsers'
import { useEffect } from 'react'
import { audiusSdk } from 'services/Audius/sdk'
import { useUser } from 'store/cache/user/hooks'
import {
  AUDIUS_NETWORK_ID,
  ETH_NETWORK_ID,
  disableRefreshAfterNetworkChange,
  switchNetwork
} from 'utils/switchNetwork'

const env = import.meta.env.VITE_ENVIRONMENT

export const useConnectAudiusProfile = (wallet: string) => {
  const { user } = useUser({ wallet })
  const queryClient = useQueryClient()

  const handleSuccess = async profile => {
    const sdk = await audiusSdk()
    disableRefreshAfterNetworkChange.value = true
    const switched = await switchNetwork(AUDIUS_NETWORK_ID)
    if (switched) {
      await sdk.dashboardWalletUsers.connectUserToDashboardWallet({
        wallet: user?.wallet ?? wallet,
        userId: profile.userId,
        userSignature: profile.txSignature
      })
      // Optimistically set user
      await queryClient.cancelQueries({ queryKey: ['todos'] })
      const audiusUser = await sdk.users.getUser({ id: profile.userId })
      queryClient.setQueryData(getDashboardWalletUserQueryKey(wallet), {
        wallet,
        user: audiusUser
      })

      const switchedBack = await switchNetwork(ETH_NETWORK_ID)
      if (switchedBack) {
        window.ethereum.on('chainChanged', () => {
          disableRefreshAfterNetworkChange.value = false
        })
      } else {
        disableRefreshAfterNetworkChange.value = false
      }
    } else {
      disableRefreshAfterNetworkChange.value = false
    }
  }

  const loadOauth = async () => {
    const sdk = await audiusSdk()
    sdk.oauth.init({
      env: env === 'production' ? 'production' : 'staging',
      successCallback: handleSuccess,
      errorCallback: (errorMessage: string) => {
        // Error calllback
        console.error(errorMessage)
      }
    })
  }

  const loginWithAudius = async () => {
    const sdk = await audiusSdk()
    sdk.oauth.login({
      scope: 'write_once',
      params: {
        tx: 'connect_dashboard_wallet',
        wallet
      }
    })
  }

  useEffect(() => {
    loadOauth()
  }, [])

  return loginWithAudius
}
