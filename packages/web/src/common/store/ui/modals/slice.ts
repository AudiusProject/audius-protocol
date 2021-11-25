import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { CommonState } from 'common/store'

export type Modals =
  | 'TiersExplainer'
  | 'TrendingRewardsExplainer'
  | 'ChallengeRewardsExplainer'
  | 'LinkSocialRewardsExplainer'
  | 'APIRewardsExplainer'
  | 'TransferAudioMobileWarning'
  | 'MobileConnectWalletsDrawer'
  | 'ShareSoundToTikTok'
  | 'HCaptcha'
  | 'ConfirmAudioToWAudio'
  | 'BrowserPushPermissionConfirmation'
  | 'AudioBreakdown'
  | 'CollectibleDetails'
  | 'DeactivateAccountConfirmation'

export type ModalsState = { [modal in Modals]: boolean }

const initialState: ModalsState = {
  TiersExplainer: false,
  TrendingRewardsExplainer: false,
  ChallengeRewardsExplainer: false,
  LinkSocialRewardsExplainer: false,
  APIRewardsExplainer: false,
  TransferAudioMobileWarning: false,
  MobileConnectWalletsDrawer: false,
  ShareSoundToTikTok: false,
  HCaptcha: false,
  ConfirmAudioToWAudio: false,
  BrowserPushPermissionConfirmation: false,
  AudioBreakdown: false,
  CollectibleDetails: false,
  DeactivateAccountConfirmation: false
}

const slice = createSlice({
  name: 'application/ui/modals',
  initialState,
  reducers: {
    setVisibility: (
      state,
      action: PayloadAction<{
        modal: Modals
        visible: boolean
      }>
    ) => {
      const { modal, visible } = action.payload
      state[modal] = visible
    }
  }
})

export const getModalVisibility = (state: CommonState, modal: Modals) =>
  state.ui.modals[modal]

export const getModalIsOpen = (state: CommonState) =>
  Object.values(state.ui.modals).some(isOpen => isOpen)

export const { setVisibility } = slice.actions

export default slice.reducer
