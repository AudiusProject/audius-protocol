import { select } from 'redux-saga-test-plan/matchers'
import { all, call, put, race, take, takeLatest } from 'redux-saga/effects'
import { WalletLinkProvider } from 'walletlink'

import { Chain } from 'common/models/Chain'
import { ID } from 'common/models/Identifiers'
import Kind from 'common/models/Kind'
import { BNWei, WalletAddress } from 'common/models/Wallet'
import { fetchAccountSucceeded } from 'common/store/account/reducer'
import { getUserId, getAccountUser } from 'common/store/account/selectors'
import * as cacheActions from 'common/store/cache/actions'
import { upgradeToCreator } from 'common/store/cache/users/sagas'
import { Nullable } from 'common/utils/typeUtils'
import { CollectibleState } from 'containers/collectibles/types'
import {
  fetchOpenSeaAssetsForWallets,
  fetchSolanaCollectiblesForWallets
} from 'containers/profile-page/store/sagas'
import { fetchServices } from 'containers/service-selection/store/slice'
import { newUserMetadata } from 'schemas'
import AudiusBackend from 'services/AudiusBackend'
import apiClient, {
  AssociatedWalletsResponse
} from 'services/audius-api-client/AudiusAPIClient'
import { BooleanKeys, getRemoteVar } from 'services/remote-config'
import walletClient from 'services/wallet-client/WalletClient'
import connectWeb3Wallet, {
  loadWalletLink,
  loadBitski,
  loadWalletConnect
} from 'services/web3-modal/index'
import { requestConfirmation } from 'store/confirmer/actions'
import { confirmTransaction } from 'store/confirmer/sagas'
import {
  send as walletSend,
  claimFailed,
  sendSucceeded,
  getBalance,
  sendFailed
} from 'store/wallet/slice'
import { weiToString } from 'utils/wallet'

import {
  fetchAssociatedWallets,
  connectNewWallet,
  removeWallet as removeWalletAction,
  pressSend,
  setModalState,
  setModalVisibility,
  inputSendData,
  confirmSend,
  getSendData,
  setDiscordCode,
  setIsConnectingWallet,
  setWalletAddedConfirmed,
  setAssociatedWallets,
  confirmRemoveWallet,
  getAssociatedWallets,
  updateWalletError,
  preloadWalletProviders,
  resetStatus
} from './slice'
import { ConfirmRemoveWalletAction, ModalState } from './types'

const CONNECT_WALLET_CONFIRMATION_UID = 'CONNECT_WALLET'

function* send() {
  // Set modal state to input
  const inputStage: ModalState = {
    stage: 'SEND',
    flowState: {
      stage: 'INPUT'
    }
  }
  yield all([
    put(setModalVisibility({ isVisible: true })),
    put(setModalState({ modalState: inputStage }))
  ])

  // Await input + confirmation
  yield take(inputSendData.type)
  yield take(confirmSend.type)

  // Send the txn, update local balance
  const sendData: ReturnType<typeof getSendData> = yield select(getSendData)
  if (!sendData) return
  const { recipientWallet, amount } = sendData
  yield put(walletSend({ recipientWallet, amount: weiToString(amount) }))

  const { error }: { error: ReturnType<typeof claimFailed> } = yield race({
    success: take(sendSucceeded),
    error: take(sendFailed)
  })

  if (error) {
    const errorState: ModalState = {
      stage: 'SEND',
      flowState: {
        stage: 'ERROR',
        error: error.payload.error ?? ''
      }
    }
    yield put(setModalState({ modalState: errorState }))
    return
  }

  // Set modal state + new token + claim balances
  const sentState: ModalState = {
    stage: 'SEND',
    flowState: {
      stage: 'CONFIRMED_SEND',
      amount: weiToString(amount),
      recipientWallet
    }
  }
  yield put(setModalState({ modalState: sentState }))
}

function* fetchEthWalletInfo(wallets: string[]) {
  const ethWalletBalances: {
    address: string
    balance: BNWei
  }[] = yield call(walletClient.getEthWalletBalances, wallets)

  const collectiblesMap: CollectibleState = yield call(
    fetchOpenSeaAssetsForWallets,
    wallets
  )

  const collectibleCounts = wallets.map(
    wallet => collectiblesMap[wallet]?.length ?? 0
  )

  return wallets.map((_, idx) => ({
    ...ethWalletBalances[idx],
    collectibleCount: collectibleCounts[idx]
  }))
}

function* fetchSplWalletInfo(wallets: string[]) {
  const splWalletBalances: {
    address: string
    balance: BNWei
  }[] = yield call(walletClient.getSolWalletBalances, wallets)

  const collectiblesMap: CollectibleState = yield call(
    fetchSolanaCollectiblesForWallets,
    wallets
  )

  const collectibleCounts = wallets.map(
    wallet => collectiblesMap[wallet]?.length ?? 0
  )

  return wallets.map((_, idx) => ({
    ...splWalletBalances[idx],
    collectibleCount: collectibleCounts[idx]
  }))
}

function* fetchAccountAssociatedWallets() {
  const accountUserId: Nullable<ID> = yield select(getUserId)
  if (!accountUserId) return
  const associatedWallets: AssociatedWalletsResponse = yield apiClient.getAssociatedWallets(
    {
      userID: accountUserId
    }
  )
  const ethWalletBalances: {
    address: string
    balance: BNWei
    collectibleCount: number
  }[] = yield fetchEthWalletInfo(associatedWallets.wallets)

  const splWalletBalances: {
    address: string
    balance: BNWei
    collectibleCount: number
  }[] = yield fetchSplWalletInfo(associatedWallets.sol_wallets ?? [])

  yield put(
    setAssociatedWallets({
      associatedWallets: ethWalletBalances,
      chain: Chain.Eth
    })
  )
  yield put(
    setAssociatedWallets({
      associatedWallets: splWalletBalances,
      chain: Chain.Sol
    })
  )
}

function* getAccountMetadataCID(): Generator<any, Nullable<string>, any> {
  const accountUserId: Nullable<ID> = yield select(getUserId)
  if (!accountUserId) return null
  const users: any[] = yield call(AudiusBackend.getCreators, [accountUserId])
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
      yield web3Instance.currentProvider.close()
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
    const isBitSkiEnabled = getRemoteVar(
      BooleanKeys.DISPLAY_WEB3_PROVIDER_BITSKI
    ) as boolean
    const isWalletConnectEnabled = getRemoteVar(
      BooleanKeys.DISPLAY_WEB3_PROVIDER_WALLET_CONNECT
    ) as boolean
    const isWalletLinkEnabled = getRemoteVar(
      BooleanKeys.DISPLAY_WEB3_PROVIDER_WALLET_LINK
    ) as boolean
    const isPhantomEnabled = getRemoteVar(
      BooleanKeys.DISPLAY_SOLANA_WEB3_PROVIDER_PHANTOM
    ) as boolean

    // @ts-ignore: type web3Instance
    web3Instance = yield connectWeb3Wallet({
      isBitSkiEnabled,
      isWalletConnectEnabled,
      isWalletLinkEnabled,
      isPhantomEnabled
    })
    if (!web3Instance) {
      yield put(
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
      yield call(connectPhantomWallet, provider)
    } else {
      yield call(connectEthWallet, web3Instance)
    }
  } catch (err) {
    // if error is "Cannot use 'in' operator to search for 'message' in Modal closed by user",
    // do not show error message because user closed the modal
    const errorMessage = err.message.includes('Modal closed by user')
      ? null
      : 'An error occured while connecting a wallet with your account.'
    yield put(
      updateWalletError({
        errorMessage
      })
    )
  }
}

function* connectPhantomWallet(solana: any) {
  const connectingWallet: string = solana.publicKey.toString()
  const disconnect = async () => {
    await solana.disconnect()
  }
  yield connectSPLWallet(connectingWallet, solana.signMessage, disconnect)
}

type SolanaSignMessage = (
  encodedMessage: Uint8Array,
  encoding: string
) => Promise<{
  publicKey: any
  signature: any
}>

function* connectSPLWallet(
  connectingWallet: string,
  solanaSignMessage: SolanaSignMessage,
  disconnect: () => Promise<void>
) {
  try {
    const accountUserId: Nullable<ID> = yield select(getUserId)

    const currentAssociatedWallets: ReturnType<typeof getAssociatedWallets> = yield select(
      getAssociatedWallets
    )

    const associatedUserId: Nullable<ID> = yield apiClient.getAssociatedWalletUserId(
      { address: connectingWallet }
    )

    if (
      (currentAssociatedWallets?.connectedSolWallets ?? []).some(
        wallet => wallet.address === connectingWallet
      ) ||
      associatedUserId !== null
    ) {
      // The wallet already exists in the associated wallets set
      yield put(
        updateWalletError({
          errorMessage:
            'This wallet has already been associated with an Audius account.'
        })
      )
      return
    }

    const splWalletBalances: {
      address: string
      balance: BNWei
    }[] = yield call(walletClient.getSolWalletBalances, [connectingWallet])
    const walletBalance = splWalletBalances[0].balance

    const collectiblesMap: CollectibleState = yield call(
      fetchSolanaCollectiblesForWallets,
      [connectingWallet]
    )

    const collectibleCount = collectiblesMap[connectingWallet]?.length ?? 0

    yield put(
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
    const signedResponse: {
      publicKey: any
      signature: any
    } = yield solanaSignMessage(encodedMessage, 'utf8')

    const publicKey = signedResponse.publicKey.toString()
    const signature = signedResponse.signature.toString('hex')

    if (publicKey !== connectingWallet) {
      yield put(
        updateWalletError({
          errorMessage:
            'An error occured while connecting a wallet with your account.'
        })
      )
      return
    }

    const userMetadata: ReturnType<typeof getAccountUser> = yield select(
      getAccountUser
    )
    let updatedMetadata = newUserMetadata({ ...userMetadata })

    if (
      !updatedMetadata.creator_node_endpoint ||
      !updatedMetadata.metadata_multihash
    ) {
      yield put(fetchServices())
      const upgradedToCreator: boolean = yield call(upgradeToCreator)
      if (!upgradedToCreator) {
        yield call(disconnect)
        yield put(
          updateWalletError({
            errorMessage:
              'An error occured while connecting a wallet with your account.'
          })
        )
        return
      }
      const updatedUserMetadata: ReturnType<typeof getAccountUser> = yield select(
        getAccountUser
      )
      updatedMetadata = newUserMetadata({ ...updatedUserMetadata })
    }

    const currentWalletSignatures: Record<string, any> = yield call(
      AudiusBackend.fetchUserAssociatedSolWallets,
      updatedMetadata
    )
    updatedMetadata.associated_sol_wallets = {
      ...(currentWalletSignatures || {}),
      [connectingWallet]: { signature }
    }

    yield put(
      requestConfirmation(
        CONNECT_WALLET_CONFIRMATION_UID,
        function* () {
          const { blockHash, blockNumber } = yield call(
            AudiusBackend.updateCreator,
            updatedMetadata,
            accountUserId
          )

          const confirmed: boolean = yield call(
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
          yield put(getBalance())

          yield put(
            setWalletAddedConfirmed({
              wallet: connectingWallet,
              balance: walletBalance,
              collectibleCount,
              chain: Chain.Sol
            })
          )
          const updatedCID: Nullable<string> = yield call(getAccountMetadataCID)
          if (updatedCID) {
            yield put(
              cacheActions.update(Kind.USERS, [
                {
                  id: accountUserId,
                  metadata: { metadata_multihash: updatedCID }
                }
              ])
            )
          }
          // Disconnect the web3 instance because after we've linked, we no longer need it
          yield call(disconnect)
        },
        function* () {
          yield put(
            updateWalletError({
              errorMessage:
                'An error occured while connecting a wallet with your account.'
            })
          )
          // Disconnect the web3 instance in the event of an error, we no longer need it
          yield call(disconnect)
        }
      )
    )
  } catch (error) {
    console.error(error)
    // Disconnect the web3 instance in the event of an error, we no longer need it
    // if (solana.isConnected) yield call(solana.disconnect)
    yield put(
      updateWalletError({
        errorMessage:
          'An error occured while connecting a wallet with your account.'
      })
    )
    yield call(disconnect)
  }
}

function* connectEthWallet(web3Instance: any) {
  try {
    const accounts: string[] = yield web3Instance.eth.getAccounts()
    const accountUserId: Nullable<ID> = yield select(getUserId)
    const connectingWallet = accounts[0]

    const currentAssociatedWallets: ReturnType<typeof getAssociatedWallets> = yield select(
      getAssociatedWallets
    )

    const associatedUserId: Nullable<ID> = yield apiClient.getAssociatedWalletUserId(
      { address: connectingWallet }
    )

    if (
      (currentAssociatedWallets?.connectedEthWallets ?? []).some(
        wallet => wallet.address === connectingWallet
      ) ||
      associatedUserId !== null
    ) {
      yield disconnectWeb3(web3Instance)
      // The wallet already exists in the associated wallets set
      yield put(
        updateWalletError({
          errorMessage:
            'This wallet has already been associated with an Audius account.'
        })
      )
      return
    }
    const walletBalances: {
      address: string
      balance: BNWei
    }[] = yield call(walletClient.getEthWalletBalances, [connectingWallet])
    const walletBalance = walletBalances[0].balance

    const collectiblesMap: CollectibleState = yield call(
      fetchOpenSeaAssetsForWallets,
      [connectingWallet]
    )

    const collectibleCount = collectiblesMap[connectingWallet]?.length ?? 0

    yield put(
      setIsConnectingWallet({
        wallet: connectingWallet,
        chain: Chain.Eth,
        balance: walletBalance,
        collectibleCount
      })
    )
    const signature: string = yield web3Instance.eth.personal.sign(
      `AudiusUserID:${accountUserId}`,
      accounts[0]
    )

    const userMetadata: ReturnType<typeof getAccountUser> = yield select(
      getAccountUser
    )
    let updatedMetadata = newUserMetadata({ ...userMetadata })

    if (
      !updatedMetadata.creator_node_endpoint ||
      !updatedMetadata.metadata_multihash
    ) {
      yield put(fetchServices())
      const upgradedToCreator: boolean = yield call(upgradeToCreator)
      if (!upgradedToCreator) {
        yield put(
          updateWalletError({
            errorMessage:
              'An error occured while connecting a wallet with your account.'
          })
        )
        return
      }
      const updatedUserMetadata: ReturnType<typeof getAccountUser> = yield select(
        getAccountUser
      )
      updatedMetadata = newUserMetadata({ ...updatedUserMetadata })
    }

    const currentWalletSignatures: Record<string, any> = yield call(
      AudiusBackend.fetchUserAssociatedEthWallets,
      updatedMetadata
    )
    updatedMetadata.associated_wallets = {
      ...(currentWalletSignatures || {}),
      [connectingWallet]: { signature }
    }

    yield put(
      requestConfirmation(
        CONNECT_WALLET_CONFIRMATION_UID,
        function* () {
          const { blockHash, blockNumber } = yield call(
            AudiusBackend.updateCreator,
            updatedMetadata,
            accountUserId
          )

          const confirmed: boolean = yield call(
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
          yield put(getBalance())

          yield put(
            setWalletAddedConfirmed({
              wallet: connectingWallet,
              balance: walletBalance,
              collectibleCount,
              chain: Chain.Eth
            })
          )
          const updatedCID: Nullable<string> = yield call(getAccountMetadataCID)
          if (updatedCID) {
            yield put(
              cacheActions.update(Kind.USERS, [
                {
                  id: accountUserId,
                  metadata: { metadata_multihash: updatedCID }
                }
              ])
            )
          }
          // Disconnect the web3 instance because after we've linked, we no longer need it
          yield disconnectWeb3(web3Instance)
        },
        function* () {
          yield put(
            updateWalletError({
              errorMessage:
                'An error occured while connecting a wallet with your account.'
            })
          )
          // Disconnect the web3 instance in the event of an error, we no longer need it
          yield disconnectWeb3(web3Instance)
        }
      )
    )
  } catch (error) {
    // Disconnect the web3 instance in the event of an error, we no longer need it
    yield disconnectWeb3(web3Instance)
    yield put(
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
    const accountUserId: Nullable<ID> = yield select(getUserId)
    const userMetadata: ReturnType<typeof getAccountUser> = yield select(
      getAccountUser
    )
    const updatedMetadata = newUserMetadata({ ...userMetadata })

    if (removeChain === Chain.Eth) {
      const currentAssociatedWallets: Record<string, any> = yield call(
        AudiusBackend.fetchUserAssociatedEthWallets,
        updatedMetadata
      )
      if (
        currentAssociatedWallets &&
        !(removeWallet in currentAssociatedWallets)
      ) {
        // The wallet already removed from the associated wallets set
        yield put(updateWalletError({ errorMessage: 'Wallet already removed' }))
        return
      }

      updatedMetadata.associated_wallets = {
        ...(currentAssociatedWallets || {})
      }

      delete updatedMetadata.associated_wallets[removeWallet]
    } else if (removeChain === Chain.Sol) {
      const currentAssociatedWallets: Record<string, any> = yield call(
        AudiusBackend.fetchUserAssociatedSolWallets,
        updatedMetadata
      )
      if (
        currentAssociatedWallets &&
        !(removeWallet in currentAssociatedWallets)
      ) {
        // The wallet already removed fromthe associated wallets set
        yield put(updateWalletError({ errorMessage: 'Wallet already removed' }))
        return
      }

      updatedMetadata.associated_sol_wallets = {
        ...(currentAssociatedWallets || {})
      }
      delete updatedMetadata.associated_sol_wallets[removeWallet]
    }

    yield put(
      requestConfirmation(
        CONNECT_WALLET_CONFIRMATION_UID,
        function* () {
          const { blockHash, blockNumber } = yield call(
            AudiusBackend.updateCreator,
            updatedMetadata,
            accountUserId
          )

          const confirmed: boolean = yield call(
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
          yield put(getBalance())
          yield put(
            removeWalletAction({ wallet: removeWallet, chain: removeChain })
          )
          const updatedCID: Nullable<string> = yield call(getAccountMetadataCID)
          yield put(
            cacheActions.update(Kind.USERS, [
              {
                id: accountUserId,
                metadata: { metadata_multihash: updatedCID }
              }
            ])
          )
        },
        function* () {
          yield put(
            updateWalletError({ errorMessage: 'Unable to remove wallet' })
          )
        }
      )
    )
  } catch (error) {
    yield put(updateWalletError({ errorMessage: 'Unable to remove wallet' }))
  }
}

const getSignableData = () => {
  const vals = 'abcdefghijklmnopqrstuvwxyz123456789'
  return vals.charAt(Math.floor(Math.random() * vals.length))
}

function* watchForDiscordCode() {
  yield take(fetchAccountSucceeded.type)
  const data = getSignableData()
  const signature: string = yield call(AudiusBackend.getSignature, data)
  const appended = `${signature}:${data}`
  yield put(setDiscordCode({ code: appended }))
}

function* preloadProviders() {
  yield loadWalletConnect()
  yield loadBitski()
  yield loadWalletLink()
}

function* watchPressSend() {
  yield takeLatest(pressSend.type, send)
}

function* watchGetAssociatedWallets() {
  yield takeLatest(fetchAssociatedWallets.type, fetchAccountAssociatedWallets)
}

function* watchConnectNewWallet() {
  yield takeLatest(connectNewWallet.type, connectWallet)
}

function* watchPreloadWalletProviders() {
  yield takeLatest(preloadWalletProviders.type, preloadProviders)
}

function* watchRemoveWallet() {
  yield takeLatest(confirmRemoveWallet.type, removeWallet)
}

const sagas = () => {
  return [
    watchPressSend,
    watchForDiscordCode,
    watchGetAssociatedWallets,
    watchConnectNewWallet,
    watchRemoveWallet,
    watchPreloadWalletProviders
  ]
}

export default sagas
