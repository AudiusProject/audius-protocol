import {
  accountSelectors,
  tokenDashboardPageSelectors,
  tokenDashboardPageActions
} from '@audius/common/store'
import { useEffect } from 'react'

import { useWalletConnect as useWalletConnectBase } from '@walletconnect/react-native-dapp'
import { useDispatch, useSelector } from 'react-redux'
import { useEffectOnce } from 'react-use'

import { connectNewWallet, signMessage } from 'app/store/wallet-connect/slice'

const { updateWalletError } = tokenDashboardPageActions
const { getUserId } = accountSelectors
const { getConfirmingWallet, getConfirmingWalletStatus } =
  tokenDashboardPageSelectors

export const useWalletConnect = () => {
  const connector = useWalletConnectBase()
  const dispatch = useDispatch()
  const walletStatus = useSelector(getConfirmingWalletStatus)
  const { wallet } = useSelector(getConfirmingWallet)
  const accountUserId = useSelector(getUserId)

  // Subscribe to wallet-connect connections to establish we are using
  // wallet-connect flow
  useEffect(() => {
    connector.on('connect', (_, payload) => {
      const { accounts } = payload.params[0]
      const wallet = accounts[0]

      dispatch(
        connectNewWallet({
          publicKey: wallet,
          connectionType: 'wallet-connect'
        })
      )
    })
    return () => {
      connector?.off('connect')
    }
  }, [connector, dispatch])

  const sessionConnected =
    walletStatus === 'Connecting' && wallet && connector.session.connected

  // Once a wallet is connected, send a message to wallet to sign
  useEffect(() => {
    if (sessionConnected) {
      const message = `AudiusUserID:${accountUserId}`
      const messageParams = [message, wallet]

      // unfortunately this doesn't trigger when called right away,
      // even when session.connected is true
      const timeout = setTimeout(() => {
        connector
          .signPersonalMessage(messageParams)
          .then((result) => {
            dispatch(
              signMessage({ data: result, connectionType: 'wallet-connect' })
            )
          })
          .catch(() => {
            dispatch(
              updateWalletError({
                errorMessage:
                  'An error occured while connecting a wallet with your account.'
              })
            )
          })
      }, 1000)
      return () => clearTimeout(timeout)
      // If we don't delay, then too many async jobs are queued up before
      // coming back to app.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet, accountUserId, dispatch, walletStatus, sessionConnected])

  // ensures we don't have a stale session lying around
  useEffectOnce(() => {
    if (connector.session.connected) {
      connector.killSession()
    }
  })

  return { connector, wallet }
}
