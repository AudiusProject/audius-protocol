import { Action, combineReducers, Reducer } from '@reduxjs/toolkit'

import { addFundsModalReducer } from './add-funds-modal'
import { albumTrackRemoveConfirmationModalReducer } from './album-track-remove-confirmation-modal'
import { artistPickModalReducer } from './artist-pick-modal'
import { coinflowOnrampModalReducer } from './coinflow-onramp-modal'
import { coinflowWithdrawModalReducer } from './coinflow-withdraw-modal'
import { chatBlastModalReducer } from './create-chat-blast-modal'
import { createChatModalReducer } from './create-chat-modal'
import { deleteTrackConfirmationModalReducer } from './delete-track-confirmation-modal'
import { earlyReleaseConfirmationModalReducer } from './early-release-confirmation-modal'
import { editAccessConfirmationModalReducer } from './edit-access-confirmation-modal'
import { hideContentConfirmationModalReducer } from './hide-confirmation-modal'
import { inboxUnavailableModalReducer } from './inbox-unavailable-modal'
import { leavingAudiusModalReducer } from './leaving-audius-modal'
import parentReducer, { initialState } from './parentSlice'
import { premiumContentPurchaseModalReducer } from './premium-content-purchase-modal'
import { publishConfirmationModalReducer } from './publish-confirmation-modal'
import { BaseModalState, Modals, ModalsState } from './types'
import { uploadConfirmationModalReducer } from './upload-confirmation-modal'
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
  CreateChatModal: createChatModalReducer,
  ChatBlastModal: chatBlastModalReducer,
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
  ArtistPick: artistPickModalReducer,
  AlbumTrackRemoveConfirmation: albumTrackRemoveConfirmationModalReducer,
  UploadConfirmation: uploadConfirmationModalReducer,
  EditAccessConfirmation: editAccessConfirmationModalReducer,
  EarlyReleaseConfirmation: earlyReleaseConfirmationModalReducer,
  DeleteTrackConfirmation: deleteTrackConfirmationModalReducer,
  PublishConfirmation: publishConfirmationModalReducer,
  HideContentConfirmation: hideContentConfirmationModalReducer
})

/**
 * Return a reducer that processes child slices, then parent slice.
 * This maintains backwards compatibility between modals created without createModal
 */
export const rootModalReducer = (state: ModalsState, action: Action) => {
  const firstState = combinedReducers(state, action)
  return parentReducer(firstState, action)
}
