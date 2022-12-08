import base58 from 'bs58'
import { createSelector } from 'reselect'

import type { AppState } from '../store'

import { deserializeKeyPair } from './utils'

export const getDappKeyPair = createSelector(
  (state: AppState) => state.walletConnect.dappKeyPair,
  (dappKeyPair) => (dappKeyPair ? deserializeKeyPair(dappKeyPair) : null)
)

export const getSharedSecret = createSelector(
  (state: AppState) => state.walletConnect.sharedSecret,
  (sharedSecret) => (sharedSecret ? base58.decode(sharedSecret) : null)
)

export const getConnectionType = (state: AppState) =>
  state.walletConnect.connectionType

export const getStatus = (state: AppState) => state.walletConnect.status
