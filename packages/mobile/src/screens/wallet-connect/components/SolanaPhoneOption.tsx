import { useCallback } from 'react'

import { accountSelectors, tokenDashboardPageActions } from '@audius/common'
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconSolana from 'app/assets/images/iconSolana.svg'
import {
  connectNewWallet,
  setConnectionType,
  signMessage
} from 'app/store/wallet-connect/slice'

import { WalletConnectOption } from './WalletConnectOption'
import useAuthorization from './useSolanaPhoneAuthorization'

const { updateWalletError } = tokenDashboardPageActions
const { getUserId } = accountSelectors

export const SolanaPhoneOption = () => {
  const dispatch = useDispatch()
  const accountUserId = useSelector(getUserId)

  const { authorizeSession, selectedAccount } = useAuthorization()
  const handleConnectWallet = useCallback(async () => {
    dispatch(
      setConnectionType({ connectionType: 'solana-phone-wallet-adapter' })
    )

    const message = `AudiusUserID:${accountUserId}`
    const messageBuffer = new Uint8Array(
      message.split('').map((c) => c.charCodeAt(0))
    )

    let publicKey: string

    const {
      // @ts-ignore: wallet adapter types are wrong
      signed_payloads: [signature]
    } = await transact(async (wallet) => {
      const freshAccount = await authorizeSession(wallet)
      // Existing account or newly connected account
      publicKey = selectedAccount?.address ?? freshAccount.address

      dispatch(
        connectNewWallet({
          connectionType: 'solana-phone-wallet-adapter',
          publicKey
        })
      )

      try {
        return await wallet.signMessages({
          addresses: [publicKey],
          payloads: [Buffer.from(messageBuffer).toString('base64')]
        })
      } catch (e) {
        dispatch(
          updateWalletError({
            errorMessage:
              'An error occured while connecting a wallet with your account.'
          })
        )
        return { signed_payloads: [''] }
      }
    })

    dispatch(
      signMessage({
        path: 'wallet-sign-message',
        data: signature,
        connectionType: 'solana-phone-wallet-adapter'
      })
    )
  }, [dispatch, authorizeSession, selectedAccount, accountUserId])

  return (
    <WalletConnectOption
      name='Solana'
      icon={
        <View
          style={{
            backgroundColor: 'black',
            height: 50,
            width: 50,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 25
          }}
        >
          <IconSolana height={30} width={30} />
        </View>
      }
      onPress={handleConnectWallet}
    />
  )
}
