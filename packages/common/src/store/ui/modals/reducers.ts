import { Action, combineReducers, Reducer } from '@reduxjs/toolkit'

import { addFundsModalReducer } from './add-funds-modal'
import { artistPickModalReducer } from './artist-pick-modal'
import { coinflowOnrampModalReducer } from './coinflow-onramp-modal'
import { coinflowWithdrawModalReducer } from './coinflow-withdraw-modal'
import { createChatModalReducer } from './create-chat-modal'
import { editPlaylistModalReducer } from './edit-playlist-modal'
import { editTrackModalReducer } from './edit-track-modal'
import { inboxUnavailableModalReducer } from './inbox-unavailable-modal'
import { leavingAudiusModalReducer } from './leaving-audius-modal'
import parentReducer, { initialState } from './parentSlice'
import { premiumContentPurchaseModalReducer } from './premium-content-purchase-modal'
import { BaseModalState, Modals, ModalsState } from './types'
import { usdcManualTransferModalReducer } from './usdc-manual-transfer-modal'
import { usdcPurchaseDetailsModalReducer } from './usdc-purchase-details-modal'
import { usdcTransactionDetailsModalReducer } from './usdc-transaction-details-modal'
import { waitForDownloadModalReducer } from './wait-for-download-modal'
import { withdrawUSDCModalReducer } from './withdraw-usdc-modal'

/**
 * Create a bunch of reducers that do nothing, so that the state is maintained and not lost through the child reducers
 */
const noOpReducers = Object.keys(initialState).reduce((prev, curr) => {
  return {
    ...prev,
    [curr]: (s: BaseModalState = { isOpen: false }) => s
  }
}, {} as Record<Modals, Reducer<BaseModalState>>)

/**
 * Combine all the child reducers to build the entire parent slice state
 */
const combinedReducers = combineReducers({
  ...noOpReducers,
  EditPlaylist: editPlaylistModalReducer,
  EditTrack: editTrackModalReducer,
  CreateChatModal: createChatModalReducer,
  InboxUnavailableModal: inboxUnavailableModalReducer,
  LeavingAudiusModal: leavingAudiusModalReducer,
  WithdrawUSDCModal: withdrawUSDCModalReducer,
  USDCPurchaseDetailsModal: usdcPurchaseDetailsModalReducer,
  USDCManualTransferModal: usdcManualTransferModalReducer,
  AddFundsModal: addFundsModalReducer,
  USDCTransactionDetailsModal: usdcTransactionDetailsModalReducer,
  PremiumContentPurchaseModal: premiumContentPurchaseModalReducer,
  CoinflowOnramp: coinflowOnrampModalReducer,
  CoinflowWithdraw: coinflowWithdrawModalReducer,
  WaitForDownloadModal: waitForDownloadModalReducer,
  ArtistPick: artistPickModalReducer
})

/**
 * Return a reducer that processes child slices, then parent slice.
 * This maintains backwards compatibility between modals created without createModal
 */
export const rootModalReducer = (state: ModalsState, action: Action) => {
  const firstState = combinedReducers(state, action)
  return parentReducer(firstState, action)
}
