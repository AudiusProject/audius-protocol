import { useEffect } from 'react'

import { tokenDashboardPageActions } from '@audius/common/store'
import { useRoute } from '@react-navigation/native'
import { useDispatch } from 'react-redux'

import {
  connect,
  connectNewWallet,
  signMessage
} from 'app/store/wallet-connect/slice'

import type { WalletConnectRoute } from './types'

const { updateWalletError } = tokenDashboardPageActions

export const usePhantomConnect = () => {
  const dispatch = useDispatch()
  const route = useRoute<WalletConnectRoute<'Wallets'>>()
  // I have no idea what's going on here. I don't think this works currently,
  // somehow the params we care about is inside the other params ???
  // @ts-ignore
  const params = route?.params?.params?.params

  useEffect(() => {
    if (!params) return
    if ('errorCode' in params) {
      dispatch(updateWalletError({ errorMessage: params.errorMessage }))
      return
    }

    // The following set of cases are hooks that handle deep links from
    // Phantom back to Audius.
    if (params.path === 'connect') {
      dispatch(connect({ ...params, connectionType: 'phantom' }))
      // Connect creates a session between Audius and phantom
    } else if (params.path === 'wallet-connect') {
      // Wallet-connect creates a session between Audius and phantom
      // and then associates the wallet to the user's profile
      dispatch(connectNewWallet({ ...params, connectionType: 'phantom' }))
    } else if (params.path === 'wallet-sign-message') {
      // Wallet-sign-message receives signs a string message
      dispatch(signMessage({ ...params, connectionType: 'phantom' }))
    }
  }, [params?.path, params, dispatch])
}
