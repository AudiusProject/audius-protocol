import type { ComponentType } from 'react'

import type { Modals } from '@audius/common/store'

import { AddFundsDrawer } from 'app/components/add-funds-drawer/AddFundsDrawer'
import { AddToCollectionDrawer } from 'app/components/add-to-collection-drawer'
import { ApiRewardsDrawer } from 'app/components/api-rewards-drawer/ApiRewardsDrawer'
import { AudioBreakdownDrawer } from 'app/components/audio-breakdown-drawer'
import { TiersExplainerDrawer } from 'app/components/audio-rewards'
import { BlockMessagesDrawer } from 'app/components/block-messages-drawer'
import { ChallengeRewardsDrawer } from 'app/components/challenge-rewards-drawer'
import { ClaimAllRewardsDrawer } from 'app/components/challenge-rewards-drawer/ClaimAllRewardsDrawer'
import { ChatActionsDrawer } from 'app/components/chat-actions-drawer'
import { CoinflowOnrampDrawer } from 'app/components/coinflow-onramp-drawer/CoinflowOnrampDrawer'
import { CollectibleDetailsDrawer } from 'app/components/collectible-details-drawer'
import { CommentDrawer } from 'app/components/comments/CommentDrawer'
import { CreateChatActionsDrawer } from 'app/components/create-chat-actions-drawer'
import { DeactivateAccountConfirmationDrawer } from 'app/components/deactivate-account-confirmation-drawer'
import { DeleteChatDrawer } from 'app/components/delete-chat-drawer'
import { DeletePlaylistConfirmationDrawer } from 'app/components/delete-playlist-confirmation-drawer'
import { ArtistPickConfirmationDrawer } from 'app/components/drawers/ArtistPickConfirmationDrawer'
import { MuteCommentsConfirmationDrawer } from 'app/components/drawers/MuteCommentsConfirmationDrawer'
import { DuplicateAddConfirmationDrawer } from 'app/components/duplicate-add-confirmation-drawer'
import { EditCollectiblesDrawer } from 'app/components/edit-collectibles-drawer'
import { EnablePushNotificationsDrawer } from 'app/components/enable-push-notifications-drawer'
import { FeedFilterDrawer } from 'app/components/feed-filter-drawer'
import { ForgotPasswordDrawer } from 'app/components/forgot-password-drawer'
import { InboxUnavailableDrawer } from 'app/components/inbox-unavailable-drawer/InboxUnavailableDrawer'
import { LeavingAudiusDrawer } from 'app/components/leaving-audius-drawer'
import { LockedContentDrawer } from 'app/components/locked-content-drawer'
import { ManagerModeDrawer } from 'app/components/manager-mode-drawer/ManagerModeDrawer'
import { OverflowMenuDrawer } from 'app/components/overflow-menu-drawer'
import { PlaybackRateDrawer } from 'app/components/playback-rate-drawer'
import { PremiumContentPurchaseDrawer } from 'app/components/premium-content-purchase-drawer'
import { ProfileActionsDrawer } from 'app/components/profile-actions-drawer'
import { PurchaseVendorDrawer } from 'app/components/purchase-vendor-drawer/PurchaseVendorDrawer'
import { RateCtaDrawer } from 'app/components/rate-cta-drawer'
import { ShareDrawer } from 'app/components/share-drawer'
import { SignOutConfirmationDrawer } from 'app/components/sign-out-confirmation-drawer'
import { StripeOnrampDrawer } from 'app/components/stripe-onramp-drawer'
import { SupportersInfoDrawer } from 'app/components/supporters-info-drawer'
import { TransferAudioMobileDrawer } from 'app/components/transfer-audio-mobile-drawer'
import { TrendingRewardsDrawer } from 'app/components/trending-rewards-drawer'
import { USDCManualTransferDrawer } from 'app/components/usdc-manual-transfer-drawer'
import { WaitForDownloadDrawer } from 'app/components/wait-for-download-drawer'
import { EarlyReleaseConfirmationDrawer } from 'app/screens/edit-track-screen/components/EarlyReleaseConfirmationDrawer'
import { PublishConfirmationDrawer } from 'app/screens/edit-track-screen/components/PublishConfirmationDrawer'
import { WelcomeDrawer } from 'app/screens/sign-on-screen/components/WelcomeDrawer'
import { TrendingFilterDrawer } from 'app/screens/trending-screen'

import { useDrawerState } from '../components/drawer'
import {
  DeleteTrackConfirmationDrawer,
  OfflineListeningDrawer,
  RemoveAllDownloadsDrawer,
  RemoveDownloadedCollectionDrawer,
  RemoveDownloadedFavoritesDrawer,
  UnfavoriteDownloadedCollectionDrawer
} from '../components/drawers'
import { ShareToStoryProgressDrawer } from '../components/share-drawer/useShareToStory'
import { VipDiscordDrawer } from '../components/vip-discord-drawer'
import { useDrawer } from '../hooks/useDrawer'
import type { Drawer } from '../store/drawers/slice'

type CommonDrawerProps = {
  modal: ComponentType
  modalName: Modals
}

/*
 * Conditionally renders the drawers hooked up to @audius/web/src/common/ui/modal slice
 */
const CommonDrawer = (props: CommonDrawerProps) => {
  const { modal: Modal, modalName } = props
  const { modalState } = useDrawerState(modalName)

  if (!modalState) return null

  return <Modal />
}

type NativeDrawerProps = {
  drawer: ComponentType
  drawerName: Drawer
}

/*
 * Conditionally renders the drawers hooked up to native store/drawers slice
 */
export const NativeDrawer = (props: NativeDrawerProps) => {
  const { drawer: Drawer, drawerName } = props
  const { visibleState } = useDrawer(drawerName)

  if (!visibleState) return null

  return <Drawer />
}

const commonDrawersMap: { [Modal in Modals]?: ComponentType } = {
  TiersExplainer: TiersExplainerDrawer,
  TrendingRewardsExplainer: TrendingRewardsDrawer,
  ChallengeRewardsExplainer: ChallengeRewardsDrawer,
  ClaimAllRewards: ClaimAllRewardsDrawer,
  APIRewardsExplainer: ApiRewardsDrawer,
  TransferAudioMobileWarning: TransferAudioMobileDrawer,
  MobileEditCollectiblesDrawer: EditCollectiblesDrawer,
  Share: ShareDrawer,
  CollectibleDetails: CollectibleDetailsDrawer,
  DeactivateAccountConfirmation: DeactivateAccountConfirmationDrawer,
  FeedFilter: FeedFilterDrawer,
  TrendingGenreSelection: TrendingFilterDrawer,
  Overflow: OverflowMenuDrawer,
  SignOutConfirmation: SignOutConfirmationDrawer,
  AddToCollection: AddToCollectionDrawer,
  AudioBreakdown: AudioBreakdownDrawer,
  DeletePlaylistConfirmation: DeletePlaylistConfirmationDrawer,
  DuplicateAddConfirmation: DuplicateAddConfirmationDrawer,
  VipDiscord: VipDiscordDrawer,
  ProfileActions: ProfileActionsDrawer,
  PlaybackRate: PlaybackRateDrawer,
  // PremiumContent, AddFunds, PurchaseVendor, USDCManualTransfer, and StripOnRamp *must* be in this order
  // to avoid zIndex issues.
  PremiumContentPurchaseModal: PremiumContentPurchaseDrawer,
  AddFundsModal: AddFundsDrawer,
  PurchaseVendor: PurchaseVendorDrawer,
  USDCManualTransferModal: USDCManualTransferDrawer,
  StripeOnRamp: StripeOnrampDrawer,
  CoinflowOnramp: CoinflowOnrampDrawer,
  InboxUnavailableModal: InboxUnavailableDrawer,
  LeavingAudiusModal: LeavingAudiusDrawer,
  WaitForDownloadModal: WaitForDownloadDrawer,
  PublishConfirmation: PublishConfirmationDrawer,
  EarlyReleaseConfirmation: EarlyReleaseConfirmationDrawer,
  ArtistPick: ArtistPickConfirmationDrawer
}

const nativeDrawersMap: { [DrawerName in Drawer]?: ComponentType } = {
  EnablePushNotifications: EnablePushNotificationsDrawer,
  OfflineListening: OfflineListeningDrawer,
  ForgotPassword: ForgotPasswordDrawer,
  DeleteTrackConfirmation: DeleteTrackConfirmationDrawer,
  ShareToStoryProgress: ShareToStoryProgressDrawer,
  ManagerMode: ManagerModeDrawer,
  RateCallToAction: RateCtaDrawer,
  RemoveAllDownloads: RemoveAllDownloadsDrawer,
  RemoveDownloadedCollection: RemoveDownloadedCollectionDrawer,
  RemoveDownloadedFavorites: RemoveDownloadedFavoritesDrawer,
  UnfavoriteDownloadedCollection: UnfavoriteDownloadedCollectionDrawer,
  LockedContent: LockedContentDrawer,
  ChatActions: ChatActionsDrawer,
  CreateChatActions: CreateChatActionsDrawer,
  BlockMessages: BlockMessagesDrawer,
  MuteComments: MuteCommentsConfirmationDrawer,
  DeleteChat: DeleteChatDrawer,
  SupportersInfo: SupportersInfoDrawer,
  Welcome: WelcomeDrawer,
  Comment: CommentDrawer
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
          <CommonDrawer key={modalName} modal={Modal} modalName={modalName} />
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
