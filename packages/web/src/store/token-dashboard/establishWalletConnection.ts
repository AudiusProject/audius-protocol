import { Chain } from '@audius/common/models'
import { BooleanKeys } from '@audius/common/services'
import { tokenDashboardPageActions, getContext } from '@audius/common/store'
import { getErrorMessage } from '@audius/common/utils'
import { call, put } from 'typed-redux-saga'

import { createSession } from 'services/web3-modal'
const { updateWalletError } = tokenDashboardPageActions

export function* establishWalletConnection() {
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')
  let web3Instance: any
  try {
    const isBitSkiEnabled = Boolean(
      remoteConfigInstance.getRemoteVar(
        BooleanKeys.DISPLAY_WEB3_PROVIDER_BITSKI
      )
    )
    const isWalletConnectEnabled = Boolean(
      remoteConfigInstance.getRemoteVar(
        BooleanKeys.DISPLAY_WEB3_PROVIDER_WALLET_CONNECT
      )
    )
    const isWalletLinkEnabled = Boolean(
      remoteConfigInstance.getRemoteVar(
        BooleanKeys.DISPLAY_WEB3_PROVIDER_WALLET_LINK
      )
    )
    const isPhantomEnabled = Boolean(
      remoteConfigInstance.getRemoteVar(
        BooleanKeys.DISPLAY_SOLANA_WEB3_PROVIDER_PHANTOM
      )
    )

    web3Instance = yield* call(createSession, {
      isBitSkiEnabled,
      isWalletConnectEnabled,
      isWalletLinkEnabled,
      isPhantomEnabled
    })

    if (!web3Instance) {
      yield* put(
        updateWalletError({
          errorMessage: 'Unable to connect with web3 to connect your wallet.'
        })
      )
      // The user may have exited the modal
      return
    }

    const provider = web3Instance._provider
    if (provider === window.solana) {
      return { chain: Chain.Sol, provider }
    } else {
      return { chain: Chain.Eth, provider: web3Instance }
    }
  } catch (error) {
    // if error is "Cannot use 'in' operator to search for 'message' in Modal closed by user",
    // do not show error message because user closed the modal
    const errorMessage = getErrorMessage(error).includes('Modal closed by user')
      ? null
      : 'An error occured while connecting a wallet with your account.'
    yield* put(
      updateWalletError({
        errorMessage
      })
    )
  }
}
