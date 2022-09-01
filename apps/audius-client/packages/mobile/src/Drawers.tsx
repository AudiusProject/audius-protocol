import type { ComponentType } from 'react'

import type { Modals } from '@audius/common'

import { AddToPlaylistDrawer } from 'app/components/add-to-playlist-drawer'
import { ApiRewardsDrawer } from 'app/components/api-rewards-drawer/ApiRewardsDrawer'
import { AudioBreakdownDrawer } from 'app/components/audio-breakdown-drawer'
import { TiersExplainerDrawer } from 'app/components/audio-rewards'
import { ChallengeRewardsDrawer } from 'app/components/challenge-rewards-drawer'
import { CognitoDrawer } from 'app/components/cognito-drawer/CognitoDrawer'
import { CollectibleDetailsDrawer } from 'app/components/collectible-details-drawer'
import { ConnectWalletsDrawer } from 'app/components/connect-wallets-drawer'
import { DeactivateAccountConfirmationDrawer } from 'app/components/deactivate-account-confirmation-drawer'
import { DeletePlaylistConfirmationDrawer } from 'app/components/delete-playlist-confirmation-drawer'
import { DownloadTrackProgressDrawer } from 'app/components/download-track-progress-drawer'
import { EditCollectiblesDrawer } from 'app/components/edit-collectibles-drawer'
import { EnablePushNotificationsDrawer } from 'app/components/enable-push-notifications-drawer'
import { FeedFilterDrawer } from 'app/components/feed-filter-drawer'
import { ForgotPasswordDrawer } from 'app/components/forgot-password-drawer'
import { MobileUploadDrawer } from 'app/components/mobile-upload-drawer'
import { OverflowMenuDrawer } from 'app/components/overflow-menu-drawer'
import { ShareDrawer } from 'app/components/share-drawer'
import { ShareToTikTokDrawer } from 'app/components/share-to-tiktok-drawer'
import { SignOutConfirmationDrawer } from 'app/components/sign-out-confirmation-drawer'
import { TransferAudioMobileDrawer } from 'app/components/transfer-audio-mobile-drawer'
import { TrendingRewardsDrawer } from 'app/components/trending-rewards-drawer'
import { TrendingFilterDrawer } from 'app/screens/trending-screen'

import { useDrawerState } from './components/drawer'
import { VipDiscordDrawer } from './components/vip-discord-drawer'
import { useDrawer } from './hooks/useDrawer'
import type { Drawer } from './store/drawers/slice'

type CommonDrawerProps = {
  modal: ComponentType
  modalName: Modals
}

/*
 * Conditionally renders the drawers hooked up to audius-client/src/common/ui/modal slice
 */
const CommonDrawer = ({ modal: Modal, modalName }: CommonDrawerProps) => {
  const { modalState } = useDrawerState(modalName)

  if (modalState === false) return null

  return <Modal />
}

type NativeDrawerProps = {
  drawer: ComponentType
  drawerName: Drawer
}

/*
 * Conditionally renders the drawers hooked up to native store/drawers slice
 */
const NativeDrawer = ({ drawer: Drawer, drawerName }: NativeDrawerProps) => {
  const { visibleState } = useDrawer(drawerName)

  if (visibleState === false) return null

  return <Drawer />
}

const commonDrawersMap: { [Modal in Modals]?: ComponentType } = {
  TiersExplainer: TiersExplainerDrawer,
  TrendingRewardsExplainer: TrendingRewardsDrawer,
  ChallengeRewardsExplainer: ChallengeRewardsDrawer,
  APIRewardsExplainer: ApiRewardsDrawer,
  TransferAudioMobileWarning: TransferAudioMobileDrawer,
  MobileConnectWalletsDrawer: ConnectWalletsDrawer,
  MobileEditCollectiblesDrawer: EditCollectiblesDrawer,
  Share: ShareDrawer,
  ShareSoundToTikTok: ShareToTikTokDrawer,
  CollectibleDetails: CollectibleDetailsDrawer,
  DeactivateAccountConfirmation: DeactivateAccountConfirmationDrawer,
  Cognito: CognitoDrawer,
  FeedFilter: FeedFilterDrawer,
  TrendingGenreSelection: TrendingFilterDrawer,
  MobileUpload: MobileUploadDrawer,
  Overflow: OverflowMenuDrawer,
  SignOutConfirmation: SignOutConfirmationDrawer,
  AddToPlaylist: AddToPlaylistDrawer,
  AudioBreakdown: AudioBreakdownDrawer,
  DeletePlaylistConfirmation: DeletePlaylistConfirmationDrawer,
  VipDiscord: VipDiscordDrawer
}

const nativeDrawersMap: { [DrawerName in Drawer]?: ComponentType } = {
  EnablePushNotifications: EnablePushNotificationsDrawer,
  DownloadTrackProgress: DownloadTrackProgressDrawer,
  ForgotPassword: ForgotPasswordDrawer
}

const commonDrawers = Object.entries(commonDrawersMap) as [
  Modals,
  ComponentType
][]

const nativeDrawers = Object.entries(nativeDrawersMap) as [
  Drawer,
  ComponentType
][]

export const Drawers = () => {
  return (
    <>
      {commonDrawers.map(([modalName, Modal]) => {
        return (
          <CommonDrawer modal={Modal} modalName={modalName} key={modalName} />
        )
      })}
      {nativeDrawers.map(([drawerName, Drawer]) => (
        <NativeDrawer
          key={drawerName}
          drawerName={drawerName}
          drawer={Drawer}
        />
      ))}
    </>
  )
}
