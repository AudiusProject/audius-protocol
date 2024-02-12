import { useEffect } from 'react'

import { tokenDashboardPageActions } from '@audius/common/store'
import { useRoute } from '@react-navigation/native'
import { useDispatch } from 'react-redux'

import { connectNewWallet, signMessage } from 'app/store/wallet-connect/slice'

import type { WalletConnectRoute } from './types'

const { updateWalletError } = tokenDashboardPageActions

export const usePhantomConnect = () => {
  const dispatch = useDispatch()
  const { params } = useRoute<WalletConnectRoute<'Wallets'>>()

  useEffect(() => {
    if (!params) return
    if ('errorCode' in params) {
      dispatch(updateWalletError({ errorMessage: params.errorMessage }))
      return
    }
    if (params.path === 'wallet-connect') {
      dispatch(connectNewWallet({ ...params, connectionType: 'phantom' }))
    } else if (params.path === 'wallet-sign-message') {
      dispatch(signMessage({ ...params, connectionType: 'phantom' }))
    }
  }, [params?.path, params, dispatch])
}
