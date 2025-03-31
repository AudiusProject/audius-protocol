import { BNWei } from '../../../models/Wallet'
import { Nullable } from '../../../utils/typeUtils'
import { stringWeiToBN } from '../../../utils/wallet'
import { CommonState } from '../../commonStore'

export const getSendData = (
  state: CommonState
): Nullable<{ recipientWallet: string; amount: BNWei }> => {
  const modalState = state.pages.tokenDashboard.modalState
  if (
    !(
      modalState?.stage === 'SEND' &&
      (modalState.flowState.stage === 'CONFIRMED_SEND' ||
        modalState.flowState.stage === 'SENDING' ||
        modalState.flowState.stage === 'AWAITING_CONFIRMATION')
    )
  )
    return null
  const { recipientWallet, amount } = modalState.flowState
  return { recipientWallet, amount: stringWeiToBN(amount) }
}

export const getModalState = (state: CommonState) =>
  state.pages.tokenDashboard.modalState
export const getModalVisible = (state: CommonState) =>
  state.pages.tokenDashboard.modalVisible
export const getDiscordCode = (state: CommonState) =>
  state.pages.tokenDashboard.discordCode ?? ''
export const getAssociatedWallets = (state: CommonState) =>
  state.pages.tokenDashboard.associatedWallets
export const getHasAssociatedWallets = (state: CommonState) => {
  const { connectedEthWallets: ethWallets, connectedSolWallets: solWallets } =
    state.pages.tokenDashboard.associatedWallets
  return (ethWallets?.length ?? 0) + (solWallets?.length ?? 0) > 0
}
export const getRemoveWallet = (state: CommonState) =>
  state.pages.tokenDashboard.associatedWallets.removeWallet
export const getCanRecipientReceiveWAudio = (state: CommonState) => {
  if (
    state.pages.tokenDashboard.modalState?.stage === 'SEND' &&
    state.pages.tokenDashboard.modalState.flowState.stage ===
      'AWAITING_CONFIRMATION'
  ) {
    return state.pages.tokenDashboard.modalState.flowState
      .canRecipientReceiveWAudio
  }
  return 'false'
}
export const getConfirmingWallet = (state: CommonState) =>
  state.pages.tokenDashboard.associatedWallets.confirmingWallet

export const getError = (state: CommonState) =>
  state.pages.tokenDashboard.associatedWallets.errorMessage

export const getConfirmingWalletStatus = (state: CommonState) =>
  state.pages.tokenDashboard.associatedWallets.status
