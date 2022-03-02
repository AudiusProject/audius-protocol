import { AddToPlaylistDrawer } from 'app/components/add-to-playlist-drawer'
import { ApiRewardsDrawer } from 'app/components/api-rewards-drawer/ApiRewardsDrawer'
import { TiersExplainerDrawer } from 'app/components/audio-rewards'
import { ChallengeRewardsDrawer } from 'app/components/challenge-rewards-drawer'
import { CognitoDrawer } from 'app/components/cognito-drawer/CognitoDrawer'
import { CollectibleDetailsDrawer } from 'app/components/collectible-details-drawer'
import { ConnectWalletsDrawer } from 'app/components/connect-wallets-drawer'
import { DeactivateAccountConfirmationDrawer } from 'app/components/deactivate-account-confirmation-drawer'
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

export const Drawers = () => {
  return (
    <>
      <MobileUploadDrawer />
      <EnablePushNotificationsDrawer />
      <CollectibleDetailsDrawer />
      <ConnectWalletsDrawer />
      <EditCollectiblesDrawer />
      <OverflowMenuDrawer />
      <DeactivateAccountConfirmationDrawer />
      <DownloadTrackProgressDrawer />
      <TransferAudioMobileDrawer />
      <TrendingRewardsDrawer />
      <ApiRewardsDrawer />
      <AddToPlaylistDrawer />
      <ShareToTikTokDrawer />
      <ChallengeRewardsDrawer />
      <CognitoDrawer />
      <ShareDrawer />
      <ForgotPasswordDrawer />
      <FeedFilterDrawer />
      <TrendingFilterDrawer />
      <TiersExplainerDrawer />
      <SignOutConfirmationDrawer />
      {/* Disable the audio breakdown drawer until we get
      the feature flags to work for native mobile */}
      {/* <AudioBreakdownDrawer /> */}
    </>
  )
}
