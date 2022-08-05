import {
  Kind,
  Chain,
  WalletAddress,
  Nullable,
  BooleanKeys
} from '@audius/common'
import {
  all,
  call,
  put,
  race,
  select,
  take,
  takeLatest
} from 'typed-redux-saga/macro'
import { WalletLinkProvider } from 'walletlink'

import { newUserMetadata } from 'common/schemas'
import { fetchAccountSucceeded } from 'common/store/account/reducer'
import { getUserId, getAccountUser } from 'common/store/account/selectors'
import * as cacheActions from 'common/store/cache/actions'
import { upgradeToCreator } from 'common/store/cache/users/sagas'
import {
  getSendData,
  getAssociatedWallets
} from 'common/store/pages/token-dashboard/selectors'
import {
  fetchAssociatedWallets,
  connectNewWallet,
  removeWallet as removeWalletAction,
  pressSend,
  setModalState,
  setModalVisibility as setSendAUDIOModalVisibility,
  confirmSend,
  setDiscordCode,
  setIsConnectingWallet,
  setWalletAddedConfirmed,
  setAssociatedWallets,
  confirmRemoveWallet,
  updateWalletError,
  preloadWalletProviders
} from 'common/store/pages/token-dashboard/slice'
import {
  AssociatedWallets,
  ConfirmRemoveWalletAction,
  ModalState
} from 'common/store/pages/token-dashboard/types'
import { setVisibility } from 'common/store/ui/modals/slice'
import {
  send as walletSend,
  sendSucceeded,
  getBalance,
  sendFailed
} from 'common/store/wallet/slice'
import { getErrorMessage } from 'common/utils/error'
import { weiToString } from 'common/utils/wallet'
import { fetchServices } from 'components/service-selection/store/slice'
import {
  fetchOpenSeaAssetsForWallets,
  fetchSolanaCollectiblesForWallets
} from 'pages/profile-page/sagas'
import { PhantomProvider } from 'services/AudiusBackend'
import apiClient from 'services/audius-api-client/AudiusAPIClient'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'
import walletClient from 'services/wallet-client/WalletClient'
import {
  loadWalletLink,
  loadBitski,
  loadWalletConnect,
  createSession
} from 'services/web3-modal'
import { requestConfirmation } from 'store/confirmer/actions'
import { confirmTransaction } from 'store/confirmer/sagas'

const CONNECT_WALLET_CONFIRMATION_UID = 'CONNECT_WALLET'

function* pressSendAsync() {
  // Set modal state to input
  const inputStage: ModalState = {
    stage: 'SEND',
    flowState: {
      stage: 'INPUT'
    }
  }
  yield* all([
    put(setSendAUDIOModalVisibility({ isVisible: true })),
    put(setModalState({ modalState: inputStage }))
  ])
}

function* confirmSendAsync() {
  // Send the txn, update local balance
  const sendData = yield* select(getSendData)
  if (!sendData) return
  const { recipientWallet, amount, chain } = sendData
  yield* put(
    walletSend({ recipientWallet, amount: weiToString(amount), chain })
  )

  const { error } = yield* race({
    success: take(sendSucceeded),
    error: take(sendFailed)
  })

  if (error) {
    if (error.payload.error === 'Missing social proof') {
      yield* all([
        put(setSendAUDIOModalVisibility({ isVisible: false })),
        put(setVisibility({ modal: 'SocialProof', visible: true }))
      ])
    } else {
      const errorState: ModalState = {
        stage: 'SEND',
        flowState: {
          stage: 'ERROR',
          error: error.payload.error ?? ''
        }
      }
      yield* put(setModalState({ modalState: errorState }))
    }
    return
  }

  // Set modal state + new token + claim balances
  const sentState: ModalState = {
    stage: 'SEND',
    flowState: {
      stage: 'CONFIRMED_SEND',
      amount: weiToString(amount),
      recipientWallet,
      chain
    }
  }
  yield* put(setModalState({ modalState: sentState }))
}

function* fetchEthWalletInfo(wallets: string[]) {
  const ethWalletBalances = yield* call(
    walletClient.getEthWalletBalances,
    wallets
  )

  const collectiblesMap = yield* call(fetchOpenSeaAssetsForWallets, wallets)

  const collectibleCounts = wallets.map(
    (wallet) => collectiblesMap[wallet]?.length ?? 0
  )

  return wallets.map((_, idx) => ({
    ...ethWalletBalances[idx],
    collectibleCount: collectibleCounts[idx]
  }))
}

function* fetchSplWalletInfo(wallets: string[]) {
  const splWalletBalances = yield* call(
    walletClient.getSolWalletBalances,
    wallets
  )

  const collectiblesMap = yield* call(
    fetchSolanaCollectiblesForWallets,
    wallets
  )

  const collectibleCounts = wallets.map(
    (wallet) => collectiblesMap[wallet]?.length ?? 0
  )

  return wallets.map((_, idx) => ({
    ...splWalletBalances[idx],
    collectibleCount: collectibleCounts[idx]
  }))
}

function* fetchAccountAssociatedWallets() {
  const accountUserId = yield* select(getUserId)
  if (!accountUserId) return
  const associatedWallets = yield* call(
    [apiClient, apiClient.getAssociatedWallets],
    {
      userID: accountUserId
    }
  )
  if (!associatedWallets) {
    return
  }
  const ethWalletBalances = yield* fetchEthWalletInfo(associatedWallets.wallets)

  const splWalletBalances = yield* fetchSplWalletInfo(
    associatedWallets.sol_wallets ?? []
  )

  yield* put(
    setAssociatedWallets({
      associatedWallets: ethWalletBalances,
      chain: Chain.Eth
    })
  )
  yield* put(
    setAssociatedWallets({
      associatedWallets: splWalletBalances,
      chain: Chain.Sol
    })
  )
}

function* getAccountMetadataCID(): Generator<any, Nullable<string>, any> {
  const accountUserId = yield* select(getUserId)
  if (!accountUserId) return null
  const users = yield* call(audiusBackendInstance.getCreators, [accountUserId])
  if (users.length !== 1) return null
  return users[0].metadata_multihash
}

function* disconnectWeb3(web3Instance: any) {
  try {
    if (web3Instance?.currentProvider?.disconnect) {
      web3Instance.currentProvider.disconnect()
    }
    if (web3Instance?.currentProvider?.close) {
      if (web3Instance?.currentProvider instanceof WalletLinkProvider) {
        // If we are using wallet link, re-define relay connection close
        // which triggers a document reload. If the redefinition fails
        // See source:
        // https://github.com/walletlink/walletlink/blob/522e9239c47aa2417c967fac2c4422024055c4d2/js/src/relay/WalletLinkRelay.ts#L131
        try {
          web3Instance.currentProvider._relay.resetAndReload = () => {
            const relay = web3Instance.currentProvider._relay
            relay.connection
              .setSessionMetadata('__destroyed', '1')
              .subscribe(() => {
                relay.connection.destroy()
                relay.storage.clear()
                // Intentionally leave out document.location.reload()
              })
          }
        } catch (e) {
          console.error(e)
          // Do nothing
        }
      }
      yield* web3Instance.currentProvider.close()
    }
  } catch (e) {
    console.error('Failed to disconnect web3 instance')
    console.error(e)
    // Do nothing
  }
}

function* connectWallet() {
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

    // Check if is solana instance
    const provider = web3Instance._provider
    if (provider === window.solana) {
      yield* call(connectPhantomWallet, provider)
    } else {
      yield* call(connectEthWallet, web3Instance)
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

function* connectPhantomWallet(solana: PhantomProvider) {
  const connectingWallet = solana.publicKey?.toString()
  const disconnect = async () => {
    await solana.disconnect()
  }
  if (connectingWallet) {
    yield* call(connectSPLWallet, connectingWallet, solana, disconnect)
  }
}

function* connectSPLWallet(
  connectingWallet: string,
  solana: PhantomProvider,
  disconnect: () => Promise<void>
) {
  try {
    const accountUserId = yield* select(getUserId)

    const currentAssociatedWallets = yield* select(getAssociatedWallets)

    const associatedUserId = yield* call(
      [apiClient, apiClient.getAssociatedWalletUserId],
      {
        address: connectingWallet
      }
    )

    const associatedSolWallets: AssociatedWallets =
      currentAssociatedWallets?.connectedSolWallets ?? []

    if (
      associatedSolWallets.some(
        (wallet) => wallet.address === connectingWallet
      ) ||
      associatedUserId !== null
    ) {
      // The wallet already exists in the associated wallets set
      yield* put(
        updateWalletError({
          errorMessage:
            'This wallet has already been associated with an Audius account.'
        })
      )
      return
    }

    const splWalletBalances = yield* call(walletClient.getSolWalletBalances, [
      connectingWallet
    ])
    const walletBalance = splWalletBalances[0].balance

    const collectiblesMap = yield* call(fetchSolanaCollectiblesForWallets, [
      connectingWallet
    ])

    const collectibleCount = collectiblesMap[connectingWallet]?.length ?? 0

    yield* put(
      setIsConnectingWallet({
        wallet: connectingWallet,
        chain: Chain.Sol,
        balance: walletBalance,
        collectibleCount
      })
    )
    const encodedMessage = new TextEncoder().encode(
      `AudiusUserID:${accountUserId}`
    )
    const signedResponse = yield* call(
      solana.signMessage,
      encodedMessage,
      'utf8'
    )

    const publicKey = signedResponse.publicKey.toString()
    const signature = signedResponse.signature.toString('hex')

    if (publicKey !== connectingWallet) {
      yield* put(
        updateWalletError({
          errorMessage:
            'An error occured while connecting a wallet with your account.'
        })
      )
      return
    }

    const userMetadata = yield* select(getAccountUser)
    let updatedMetadata = newUserMetadata({ ...userMetadata })

    if (
      !updatedMetadata.creator_node_endpoint ||
      !updatedMetadata.metadata_multihash
    ) {
      yield* put(fetchServices())
      const upgradedToCreator = yield* call(upgradeToCreator)
      if (!upgradedToCreator) {
        yield* call(disconnect)
        yield* put(
          updateWalletError({
            errorMessage:
              'An error occured while connecting a wallet with your account.'
          })
        )
        return
      }
      const updatedUserMetadata = yield* select(getAccountUser)
      updatedMetadata = newUserMetadata({ ...updatedUserMetadata })
    }

    const currentWalletSignatures = yield* call(
      audiusBackendInstance.fetchUserAssociatedSolWallets,
      updatedMetadata
    )
    updatedMetadata.associated_sol_wallets = {
      ...(currentWalletSignatures || {}),
      [connectingWallet]: { signature }
    }

    if (!accountUserId) {
      return
    }

    yield* put(
      requestConfirmation(
        CONNECT_WALLET_CONFIRMATION_UID,
        function* () {
          const result = yield* call(
            audiusBackendInstance.updateCreator,
            updatedMetadata,
            accountUserId
          )
          if (!result) {
            return
          }
          const { blockHash, blockNumber } = result

          const confirmed = yield* call(
            confirmTransaction,
            blockHash,
            blockNumber
          )
          if (!confirmed) {
            throw new Error(
              `Could not confirm connect wallet for account user id ${accountUserId}`
            )
          }

          const updatedWallets = updatedMetadata.associated_sol_wallets
          return Object.keys(updatedWallets)
        },
        // @ts-ignore: remove when confirmer is typed
        function* (updatedWallets: WalletAddress[]) {
          // Update the user's balance w/ the new wallet
          yield* put(getBalance())

          yield* put(
            setWalletAddedConfirmed({
              wallet: connectingWallet,
              balance: walletBalance,
              collectibleCount,
              chain: Chain.Sol
            })
          )
          const updatedCID = yield* call(getAccountMetadataCID)
          if (updatedCID) {
            yield* put(
              cacheActions.update(Kind.USERS, [
                {
                  id: accountUserId,
                  metadata: { metadata_multihash: updatedCID }
                }
              ])
            )
          }
          // Disconnect the web3 instance because after we've linked, we no longer need it
          yield* call(disconnect)
        },
        function* () {
          yield* put(
            updateWalletError({
              errorMessage:
                'An error occured while connecting a wallet with your account.'
            })
          )
          // Disconnect the web3 instance in the event of an error, we no longer need it
          yield* call(disconnect)
        }
      )
    )
  } catch (error) {
    console.error(error)
    // Disconnect the web3 instance in the event of an error, we no longer need it
    // if (solana.isConnected) yield* call(solana.disconnect)
    yield* put(
      updateWalletError({
        errorMessage:
          'An error occured while connecting a wallet with your account.'
      })
    )
    yield* call(disconnect)
  }
}

function* connectEthWallet(web3Instance: any) {
  try {
    const accounts: string[] = yield* call(
      web3Instance.eth.getAccounts as () => Promise<string[]>
    )
    const accountUserId = yield* select(getUserId)
    const connectingWallet = accounts[0]

    const currentAssociatedWallets = yield* select(getAssociatedWallets)

    const associatedUserId = yield* call(
      [apiClient, apiClient.getAssociatedWalletUserId.bind(apiClient)],
      {
        address: connectingWallet
      }
    )

    const connectedEthWallets: AssociatedWallets =
      currentAssociatedWallets?.connectedEthWallets ?? []
    if (
      connectedEthWallets.some(
        (wallet) => wallet.address === connectingWallet
      ) ||
      associatedUserId !== null
    ) {
      yield* call(disconnectWeb3, web3Instance)
      // The wallet already exists in the associated wallets set
      yield* put(
        updateWalletError({
          errorMessage:
            'This wallet has already been associated with an Audius account.'
        })
      )
      return
    }
    const walletBalances = yield* call(walletClient.getEthWalletBalances, [
      connectingWallet
    ])
    const walletBalance = walletBalances[0].balance

    const collectiblesMap = yield* call(fetchOpenSeaAssetsForWallets, [
      connectingWallet
    ])

    const collectibleCount = collectiblesMap[connectingWallet]?.length ?? 0

    yield* put(
      setIsConnectingWallet({
        wallet: connectingWallet,
        chain: Chain.Eth,
        balance: walletBalance,
        collectibleCount
      })
    )
    const signature = yield* web3Instance.eth.personal.sign(
      `AudiusUserID:${accountUserId}`,
      accounts[0]
    )

    const userMetadata = yield* select(getAccountUser)
    let updatedMetadata = newUserMetadata({ ...userMetadata })

    if (
      !updatedMetadata.creator_node_endpoint ||
      !updatedMetadata.metadata_multihash
    ) {
      yield* put(fetchServices())
      const upgradedToCreator = yield* call(upgradeToCreator)
      if (!upgradedToCreator) {
        yield* put(
          updateWalletError({
            errorMessage:
              'An error occured while connecting a wallet with your account.'
          })
        )
        return
      }
      const updatedUserMetadata = yield* select(getAccountUser)
      updatedMetadata = newUserMetadata({ ...updatedUserMetadata })
    }

    const currentWalletSignatures = yield* call(
      audiusBackendInstance.fetchUserAssociatedEthWallets,
      updatedMetadata
    )
    updatedMetadata.associated_wallets = {
      ...(currentWalletSignatures || {}),
      [connectingWallet]: { signature }
    }

    if (!accountUserId) {
      return
    }

    yield* put(
      requestConfirmation(
        CONNECT_WALLET_CONFIRMATION_UID,
        function* () {
          const result = yield* call(
            audiusBackendInstance.updateCreator,
            updatedMetadata,
            accountUserId
          )

          if (!result) {
            return
          }

          const { blockHash, blockNumber } = result

          const confirmed = yield* call(
            confirmTransaction,
            blockHash,
            blockNumber
          )
          if (!confirmed) {
            throw new Error(
              `Could not confirm connect wallet for account user id ${accountUserId}`
            )
          }

          const updatedWallets = updatedMetadata.associated_wallets
          return Object.keys(updatedWallets)
        },
        // @ts-ignore: remove when confirmer is typed
        function* (updatedWallets: WalletAddress[]) {
          // Update the user's balance w/ the new wallet
          yield* put(getBalance())

          yield* put(
            setWalletAddedConfirmed({
              wallet: connectingWallet,
              balance: walletBalance,
              collectibleCount,
              chain: Chain.Eth
            })
          )
          const updatedCID = yield* call(getAccountMetadataCID)
          if (updatedCID) {
            yield* put(
              cacheActions.update(Kind.USERS, [
                {
                  id: accountUserId,
                  metadata: { metadata_multihash: updatedCID }
                }
              ])
            )
          }
          // Disconnect the web3 instance because after we've linked, we no longer need it
          yield* disconnectWeb3(web3Instance)
        },
        function* () {
          yield* put(
            updateWalletError({
              errorMessage:
                'An error occured while connecting a wallet with your account.'
            })
          )
          // Disconnect the web3 instance in the event of an error, we no longer need it
          yield* disconnectWeb3(web3Instance)
        }
      )
    )
  } catch (error) {
    // Disconnect the web3 instance in the event of an error, we no longer need it
    yield* disconnectWeb3(web3Instance)
    yield* put(
      updateWalletError({
        errorMessage:
          'An error occured while connecting a wallet with your account.'
      })
    )
  }
}

function* removeWallet(action: ConfirmRemoveWalletAction) {
  try {
    const removeWallet = action.payload.wallet
    const removeChain = action.payload.chain
    const accountUserId = yield* select(getUserId)
    const userMetadata = yield* select(getAccountUser)
    const updatedMetadata = newUserMetadata({ ...userMetadata })

    if (removeChain === Chain.Eth) {
      const currentAssociatedWallets = yield* call(
        audiusBackendInstance.fetchUserAssociatedEthWallets,
        updatedMetadata
      )
      if (
        currentAssociatedWallets &&
        !(removeWallet in currentAssociatedWallets)
      ) {
        // The wallet already removed from the associated wallets set
        yield* put(
          updateWalletError({ errorMessage: 'Wallet already removed' })
        )
        return
      }

      updatedMetadata.associated_wallets = {
        ...(currentAssociatedWallets || {})
      }

      delete updatedMetadata.associated_wallets[removeWallet]
    } else if (removeChain === Chain.Sol) {
      const currentAssociatedWallets = yield* call(
        audiusBackendInstance.fetchUserAssociatedSolWallets,
        updatedMetadata
      )
      if (
        currentAssociatedWallets &&
        !(removeWallet in currentAssociatedWallets)
      ) {
        // The wallet already removed fromthe associated wallets set
        yield* put(
          updateWalletError({ errorMessage: 'Wallet already removed' })
        )
        return
      }

      updatedMetadata.associated_sol_wallets = {
        ...(currentAssociatedWallets || {})
      }
      delete updatedMetadata.associated_sol_wallets[removeWallet]
    }

    if (!accountUserId) {
      return
    }

    yield* put(
      requestConfirmation(
        CONNECT_WALLET_CONFIRMATION_UID,
        function* () {
          const result = yield* call(
            audiusBackendInstance.updateCreator,
            updatedMetadata,
            accountUserId
          )
          if (!result) {
            return
          }
          const { blockHash, blockNumber } = result

          const confirmed = yield* call(
            confirmTransaction,
            blockHash,
            blockNumber
          )
          if (!confirmed) {
            throw new Error(
              `Could not confirm remove wallet for account user id ${accountUserId}`
            )
          }
          return accountUserId
        },
        // @ts-ignore: remove when confirmer is typed
        function* () {
          // Update the user's balance w/ the new wallet
          yield* put(getBalance())
          yield* put(
            removeWalletAction({ wallet: removeWallet, chain: removeChain })
          )
          const updatedCID = yield* call(getAccountMetadataCID)
          yield* put(
            cacheActions.update(Kind.USERS, [
              {
                id: accountUserId,
                metadata: { metadata_multihash: updatedCID }
              }
            ])
          )
        },
        function* () {
          yield* put(
            updateWalletError({ errorMessage: 'Unable to remove wallet' })
          )
        }
      )
    )
  } catch (error) {
    yield* put(updateWalletError({ errorMessage: 'Unable to remove wallet' }))
  }
}

const getSignableData = () => {
  const vals = 'abcdefghijklmnopqrstuvwxyz123456789'
  return vals.charAt(Math.floor(Math.random() * vals.length))
}

function* watchForDiscordCode() {
  yield* take(fetchAccountSucceeded.type)
  const data = getSignableData()
  const signature = yield* call(audiusBackendInstance.getSignature, data)
  const appended = `${signature}:${data}`
  yield* put(setDiscordCode({ code: appended }))
}

function* preloadProviders() {
  yield loadWalletConnect()
  yield loadBitski()
  yield loadWalletLink()
}

function* watchPressSend() {
  yield* takeLatest(pressSend.type, pressSendAsync)
}

function* watchConfirmSend() {
  yield* takeLatest(confirmSend.type, confirmSendAsync)
}

function* watchGetAssociatedWallets() {
  yield* takeLatest(fetchAssociatedWallets.type, fetchAccountAssociatedWallets)
}

function* watchConnectNewWallet() {
  yield* takeLatest(connectNewWallet.type, connectWallet)
}

function* watchPreloadWalletProviders() {
  yield* takeLatest(preloadWalletProviders.type, preloadProviders)
}

function* watchRemoveWallet() {
  yield* takeLatest(confirmRemoveWallet.type, removeWallet)
}

const sagas = () => {
  return [
    watchPressSend,
    watchConfirmSend,
    watchForDiscordCode,
    watchGetAssociatedWallets,
    watchConnectNewWallet,
    watchRemoveWallet,
    watchPreloadWalletProviders
  ]
}

export default sagas
