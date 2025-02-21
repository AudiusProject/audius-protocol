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
