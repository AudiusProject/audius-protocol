import type { Nullable } from '@audius/common/utils'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

import type {
  ConnectionType,
  ConnectNewWalletAction,
  SignMessageAction
} from './types'

type Status = 'idle' | 'connecting' | 'connected' | 'signing' | 'done'

export type WalletConnectState = {
  dappKeyPair: Nullable<string>
  sharedSecret: Nullable<string>
  session: Nullable<string>
  publicKey: Nullable<string>
  connectionType: Nullable<ConnectionType>
  status: Status
}

const initialState: WalletConnectState = {
  dappKeyPair: null,
  sharedSecret: null,
  session: null,
  publicKey: null,
  connectionType: null,
  status: 'idle'
}

const walletConnectSlice = createSlice({
  name: 'walletConnect',
  initialState,
  reducers: {
    connectNewWallet: (_state, _action: ConnectNewWalletAction) => {},
    signMessage: (_state, _action: SignMessageAction) => {},
    setDappKeyPair: (state, action: PayloadAction<{ dappKeyPair: string }>) => {
      state.dappKeyPair = action.payload.dappKeyPair
    },
    setSharedSecret: (
      state,
      action: PayloadAction<{ sharedSecret: string }>
    ) => {
      state.sharedSecret = action.payload.sharedSecret
    },
    setSession: (state, action: PayloadAction<{ session: string }>) => {
      state.session = action.payload.session
    },
    setPublicKey: (state, action: PayloadAction<{ publicKey: string }>) => {
      state.publicKey = action.payload.publicKey
    },
    setConnectionType: (
      state,
      action: PayloadAction<{ connectionType: ConnectionType }>
    ) => {
      state.connectionType = action.payload.connectionType
    },
    setConnectionStatus: (state, action: PayloadAction<{ status: Status }>) => {
      state.status = action.payload.status
    }
  }
})

export const {
  connectNewWallet,
  signMessage,
  setDappKeyPair,
  setSharedSecret,
  setSession,
  setPublicKey,
  setConnectionType,
  setConnectionStatus
} = walletConnectSlice.actions
export default walletConnectSlice.reducer
