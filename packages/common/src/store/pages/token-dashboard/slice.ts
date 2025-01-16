import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { Status } from '~/models'
import { Nullable } from '~/utils/typeUtils'

import { Chain } from '../../../models/Chain'
import { BNWei, WalletAddress } from '../../../models/Wallet'

import {
  AssociatedWallets,
  CanReceiveWAudio,
  ConfirmRemoveWalletAction,
  InputSendDataAction,
  TokenDashboardPageModalState,
  TokenDashboardState
} from './types'

const initialConfirmingWallet = {
  wallet: null,
  chain: null,
  balance: null,
  collectibleCount: null,
  signature: null
}

const initialRemoveWallet = {
  wallet: null,
  chain: null,
  status: null
}

const initialState: TokenDashboardState = {
  modalState: null,
  modalVisible: false,
  discordCode: null,
  associatedWallets: {
    loadingStatus: Status.IDLE,
    status: null,
    connectedEthWallets: null,
    confirmingWallet: initialConfirmingWallet,
    connectedSolWallets: null,
    errorMessage: null,
    removeWallet: initialRemoveWallet
  }
}

const slice = createSlice({
  name: 'token-dashboard',
  initialState,
  reducers: {
    setModalState: (
      state,
      {
        payload: { modalState }
      }: PayloadAction<{ modalState: Nullable<TokenDashboardPageModalState> }>
    ) => {
      state.modalState = modalState
    },
    setModalVisibility: (
      state,
      { payload: { isVisible } }: PayloadAction<{ isVisible: boolean }>
    ) => {
      state.modalVisible = isVisible
    },
    inputSendData: (
      state,
      { payload: { amount, wallet } }: InputSendDataAction
    ) => {
      const newState: TokenDashboardPageModalState = {
        stage: 'SEND' as const,
        flowState: {
          stage: 'AWAITING_CONFIRMATION',
          amount,
          recipientWallet: wallet,
          canRecipientReceiveWAudio: 'loading'
        }
      }
      state.modalState = newState
    },
    setCanRecipientReceiveWAudio: (
      state,
      {
        payload: { canRecipientReceiveWAudio }
      }: PayloadAction<{ canRecipientReceiveWAudio: CanReceiveWAudio }>
    ) => {
      if (
        state.modalState?.stage === 'SEND' &&
        state.modalState.flowState.stage === 'AWAITING_CONFIRMATION'
      ) {
        state.modalState.flowState.canRecipientReceiveWAudio =
          canRecipientReceiveWAudio
      } else {
        console.error(
          'Tried to set canRecipientReceiveWAudio outside of correct flow state.'
        )
      }
    },
    transferEthAudioToSolWAudio: (state) => {
      if (
        state.modalState?.stage !== 'SEND' ||
        state.modalState.flowState.stage !== 'SENDING'
      )
        return

      state.modalState.flowState = {
        stage: 'AWAITING_CONVERTING_ETH_AUDIO_TO_SOL',
        recipientWallet: state.modalState.flowState.recipientWallet,
        amount: state.modalState.flowState.amount
      }
    },
    confirmSend: (state) => {
      if (
        state.modalState?.stage !== 'SEND' ||
        (state.modalState.flowState.stage !== 'AWAITING_CONFIRMATION' &&
          state.modalState.flowState.stage !==
            'AWAITING_CONVERTING_ETH_AUDIO_TO_SOL')
      )
        return

      state.modalState.flowState = {
        stage: 'SENDING',
        recipientWallet: state.modalState.flowState.recipientWallet,
        amount: state.modalState.flowState.amount
      }
    },
    pressReceive: (state) => {
      state.modalState = {
        stage: 'RECEIVE',
        flowState: { stage: 'KEY_DISPLAY' }
      }
      state.modalVisible = true
    },

    // Saga Actions

    pressSend: () => {},
    fetchAssociatedWallets: (state) => {
      state.associatedWallets.loadingStatus = Status.LOADING
    },
    fetchAssociatedWalletsFailed: (
      state,
      { payload: { errorMessage } }: PayloadAction<{ errorMessage: string }>
    ) => {
      state.associatedWallets.loadingStatus = Status.ERROR
      state.associatedWallets.errorMessage = errorMessage
    },
    setAssociatedWallets: (
      state,
      {
        payload: { associatedWallets, chain }
      }: PayloadAction<{ associatedWallets: AssociatedWallets; chain: Chain }>
    ) => {
      if (chain === Chain.Sol) {
        state.associatedWallets.connectedSolWallets = associatedWallets
      } else if (chain === Chain.Eth) {
        state.associatedWallets.connectedEthWallets = associatedWallets
      }
      state.associatedWallets.confirmingWallet = initialConfirmingWallet
      state.associatedWallets.status = null
      state.associatedWallets.loadingStatus = Status.SUCCESS
    },
    pressConnectWallets: (state) => {
      state.modalState = {
        stage: 'CONNECT_WALLETS',
        flowState: { stage: 'ADD_WALLET' }
      }
      state.modalVisible = true
      state.associatedWallets.removeWallet.wallet = null
      state.associatedWallets.errorMessage = null
    },
    addWallet: (state) => {
      state.associatedWallets.status = 'Connecting'
      state.associatedWallets.errorMessage = null
    },
    connectNewWallet: (state) => {
      state.associatedWallets.status = 'Connecting'
      state.associatedWallets.errorMessage = null
    },
    addConnectedWallet: (
      state,
      action: PayloadAction<{ signature: string; publicKey: string }>
    ) => {
      state.associatedWallets.confirmingWallet.signature =
        action.payload.signature
    },
    setIsConnectingWallet: (
      state,
      {
        payload: { wallet, chain, balance, collectibleCount }
      }: PayloadAction<{
        wallet: string
        chain: Chain
        balance: BNWei
        collectibleCount: number
      }>
    ) => {
      // is connecting
      state.associatedWallets.confirmingWallet.wallet = wallet
      state.associatedWallets.confirmingWallet.chain = chain
      state.associatedWallets.confirmingWallet.balance = balance
      state.associatedWallets.confirmingWallet.collectibleCount =
        collectibleCount
    },
    connectingWalletSignatureFailed: (state) => {
      state.associatedWallets.confirmingWallet = initialConfirmingWallet
    },
    setWalletAddedConfirmed: (
      state,
      action: PayloadAction<
        Partial<{
          wallet: string
          balance: BNWei
          chain: Chain
          collectibleCount: number
        }>
      >
    ) => {
      const confirmingWallet = state.associatedWallets.confirmingWallet
      const newWallet = { ...confirmingWallet, ...action.payload }
      const { chain, wallet, balance, collectibleCount } = newWallet
      switch (chain) {
        case Chain.Sol: {
          state.associatedWallets.connectedSolWallets?.push({
            address: wallet!,
            balance,
            collectibleCount: collectibleCount ?? 0
          })
          break
        }
        case Chain.Eth: {
          state.associatedWallets.connectedEthWallets?.push({
            address: wallet!,
            balance,
            collectibleCount: collectibleCount ?? 0
          })
        }
      }

      state.associatedWallets.confirmingWallet = initialConfirmingWallet
      state.associatedWallets.status = 'Confirmed'
    },
    requestRemoveWallet: (
      state,
      {
        payload: { wallet, chain }
      }: PayloadAction<{ wallet: WalletAddress; chain: Chain }>
    ) => {
      state.associatedWallets.removeWallet.wallet = wallet
      state.associatedWallets.removeWallet.chain = chain
      state.modalState = {
        stage: 'CONNECT_WALLETS',
        flowState: { stage: 'REMOVE_WALLET' }
      }
      state.associatedWallets.errorMessage = null
    },
    cancelRemoveWallet: (state) => {
      state.associatedWallets.removeWallet = initialRemoveWallet
      state.modalState = null
    },
    confirmRemoveWallet: (state, _payload: ConfirmRemoveWalletAction) => {
      state.associatedWallets.removeWallet.status = 'Confirming'
      state.modalState = {
        stage: 'CONNECT_WALLETS',
        flowState: { stage: 'ADD_WALLET' }
      }
    },
    removeWallet: (
      state,
      {
        payload: { wallet, chain }
      }: PayloadAction<{ wallet: WalletAddress; chain: Chain }>
    ) => {
      state.associatedWallets.removeWallet = {
        ...initialRemoveWallet,
        status: 'Confirmed'
      }
      if (chain === Chain.Sol) {
        state.associatedWallets.connectedSolWallets =
          state.associatedWallets.connectedSolWallets?.filter(
            (a) => a.address !== wallet
          ) ?? null
      } else if (chain === Chain.Eth) {
        state.associatedWallets.connectedEthWallets =
          state.associatedWallets.connectedEthWallets?.filter(
            (a) => a.address !== wallet
          ) ?? null
      }
    },
    updateWalletError: (
      state,
      {
        payload: { errorMessage }
      }: PayloadAction<{ errorMessage: string | null }>
    ) => {
      state.associatedWallets.errorMessage = errorMessage
      state.associatedWallets.removeWallet.status = null
      state.associatedWallets.removeWallet.wallet = null
      state.associatedWallets.removeWallet.chain = null
      state.associatedWallets.confirmingWallet = initialConfirmingWallet
      state.associatedWallets.status = null
    },
    preloadWalletProviders: (_state) => {},
    resetStatus: (state) => {
      state.associatedWallets.confirmingWallet = initialConfirmingWallet
      state.associatedWallets.status = null
    },
    resetRemovedStatus: (state) => {
      state.associatedWallets.removeWallet.status = null
    },
    resetState: () => {
      return initialState
    }
  }
})

export const {
  addWallet,
  setModalState,
  setModalVisibility,
  pressReceive,
  pressSend,
  inputSendData,
  confirmSend,
  fetchAssociatedWallets,
  setWalletAddedConfirmed,
  setAssociatedWallets,
  connectNewWallet,
  pressConnectWallets,
  setIsConnectingWallet,
  requestRemoveWallet,
  cancelRemoveWallet,
  confirmRemoveWallet,
  removeWallet,
  updateWalletError,
  preloadWalletProviders,
  resetStatus,
  resetRemovedStatus,
  transferEthAudioToSolWAudio,
  setCanRecipientReceiveWAudio,
  resetState
} = slice.actions
export const actions = slice.actions
export default slice
