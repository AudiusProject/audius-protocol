/**
 * nice-modal-react registrations.
 *
 * Modals are registered here with `registerLazyModal(id, loader)`, which
 * calls `NiceModal.register` and `registerNiceModalId`. Importing this file
 * from `AppProviders` ensures all registered modals are available before
 * anything tries to `showNiceModal(id)`.
 *
 * Add new NiceModal-managed modals here as they migrate.
 */
import { createElement, lazy, Suspense, type ComponentType } from 'react'

import { registerNiceModalId } from '@audius/common/services'
import NiceModal from '@ebay/nice-modal-react'

import 'components/add-cash-modal/AddCashModal'
import 'components/locked-content-modal/LockedContentModal'
import 'components/payout-wallet-modal/PayoutWalletModal'
import 'components/premium-content-purchase-modal/PremiumContentPurchaseModal'
import 'components/receive-tokens-modal/ReceiveTokensModal'
import 'components/rewards/modals/ClaimAllRewardsModal'
import 'components/transaction-details-modal/TransactionDetailsModal'
import 'components/usdc-purchase-details-modal/USDCPurchaseDetailsModal'
import 'components/usdc-transaction-details-modal/USDCTransactionDetailsModal'
import 'components/withdraw-usdc-modal/WithdrawUSDCModal'
import 'pages/audio-page/components/modals/AudioBreakdownModal'
import 'pages/audio-page/components/modals/TransferAudioMobileDrawer'
import 'pages/fan-club-detail-page/components/ClaimVestedCoinsModal'
import 'pages/rewards-page/components/modals/ChallengeRewardsModal/ChallengeRewardsModal'

/**
 * Wallet and Coinflow modals are registered lazily to keep AppKit and Coinflow
 * out of the entry chunk. NiceModal only renders visible modals, so nothing
 * loads until one opens. Registration stays here (not in the modal modules) so
 * the lazy import can't re-register and remount an open modal.
 */
const registerLazyModal = (
  id: string,
  loader: () => Promise<{ default: ComponentType<any> }>
) => {
  const LazyModal = lazy(loader)
  const LazyModalBoundary = (props: Record<string, unknown>) =>
    createElement(Suspense, { fallback: null }, createElement(LazyModal, props))
  LazyModalBoundary.displayName = `LazyModal(${id})`
  NiceModal.register(id, LazyModalBoundary)
  registerNiceModalId(id)
}

registerLazyModal('BuySellModal', () =>
  import('components/buy-sell-modal/BuySellModal').then((m) => ({
    default: m.BuySellModal
  }))
)
registerLazyModal(
  'SendTokensModal',
  () => import('components/send-tokens-modal/SendTokensModal')
)
registerLazyModal('ConnectedWallets', () =>
  import('pages/audio-page/components/modals/ConnectedWalletsModal').then(
    (m) => ({ default: m.ConnectedWalletsModal })
  )
)

registerLazyModal('CoinflowOnramp', () =>
  import('components/coinflow-onramp-modal/CoinflowOnrampModal').then((m) => ({
    default: m.CoinflowOnrampModal
  }))
)
registerLazyModal('CoinflowWithdraw', () =>
  import(
    'components/withdraw-usdc-modal/components/CoinflowWithdrawModal'
  ).then((m) => ({ default: m.CoinflowWithdrawModal }))
)

// Remaining modals, also lazy so none of them load until opened
registerLazyModal(
  'AddToCollection',
  () => import('components/add-to-collection/desktop/AddToCollectionModal')
)
registerLazyModal('AlbumTrackRemoveConfirmation', () =>
  import(
    'components/album-track-remove-confirmation-modal/AlbumTrackRemoveConfirmationModal'
  ).then((m) => ({
    default: m.AlbumTrackRemoveConfirmationModal
  }))
)
registerLazyModal('ArtistPick', () =>
  import('components/artist-pick-modal/ArtistPickModal').then((m) => ({
    default: m.ArtistPickModal
  }))
)
registerLazyModal(
  'DeletePlaylistConfirmation',
  () =>
    import(
      'components/delete-playlist-confirmation-modal/DeletePlaylistConfirmationModal'
    )
)
registerLazyModal('DeleteTrackConfirmation', () =>
  import(
    'components/delete-track-confirmation-modal/DeleteTrackConfirmationModal'
  ).then((m) => ({
    default: m.DeleteTrackConfirmationModal
  }))
)
registerLazyModal('DownloadTrackArchive', () =>
  import(
    'components/download-track-archive-modal/DownloadTrackArchiveModal'
  ).then((m) => ({
    default: m.DownloadTrackArchiveModal
  }))
)
registerLazyModal('DuplicateAddConfirmation', () =>
  import(
    'components/duplicate-add-confirmation-modal/DuplicateAddConfirmationModal'
  ).then((m) => ({
    default: m.DuplicateAddConfirmationModal
  }))
)
registerLazyModal('EarlyReleaseConfirmation', () =>
  import(
    'components/early-release-confirmation-modal/EarlyReleaseConfirmationModal'
  ).then((m) => ({
    default: m.EarlyReleaseConfirmationModal
  }))
)
registerLazyModal('EditAccessConfirmation', () =>
  import(
    'components/edit-access-confirmation-modal/EditAccessConfirmationModal'
  ).then((m) => ({
    default: m.EditAccessConfirmationModal
  }))
)
registerLazyModal('FinalizeWinnersConfirmation', () =>
  import(
    'components/finalize-winners-confirmation-modal/FinalizeWinnersConfirmationModal'
  ).then((m) => ({
    default: m.FinalizeWinnersConfirmationModal
  }))
)
registerLazyModal('HideContentConfirmation', () =>
  import(
    'components/hide-confirmation-modal/HideContentConfirmationModal'
  ).then((m) => ({
    default: m.HideContentConfirmationModal
  }))
)
registerLazyModal('HostRemixContest', () =>
  import('components/host-remix-contest-modal/HostRemixContestModal').then(
    (m) => ({
      default: m.HostRemixContestModal
    })
  )
)
registerLazyModal('InboxUnavailableModal', () =>
  import('components/inbox-unavailable-modal/InboxUnavailableModal').then(
    (m) => ({
      default: m.InboxUnavailableModal
    })
  )
)
registerLazyModal('LeavingAudiusModal', () =>
  import('components/leaving-audius-modal/LeavingAudiusModal').then((m) => ({
    default: m.LeavingAudiusModal
  }))
)
registerLazyModal('PublishConfirmation', () =>
  import('components/publish-confirmation-modal/PublishConfirmationModal').then(
    (m) => ({
      default: m.PublishConfirmationModal
    })
  )
)
registerLazyModal('PublishHiddenTracksConfirmation', () =>
  import(
    'components/publish-hidden-tracks-confirmation-modal/PublishHiddenTracksConfirmationModal'
  ).then((m) => ({
    default: m.PublishHiddenTracksConfirmationModal
  }))
)
registerLazyModal('ReplaceTrackConfirmation', () =>
  import(
    'components/replace-track-confirmation-modal/ReplaceTrackConfirmationModal'
  ).then((m) => ({
    default: m.ReplaceTrackConfirmationModal
  }))
)
registerLazyModal('ReplaceTrackProgress', () =>
  import(
    'components/replace-track-progress-modal/ReplaceTrackProgressModal'
  ).then((m) => ({
    default: m.ReplaceTrackProgressModal
  }))
)
registerLazyModal(
  'APIRewardsExplainer',
  () => import('components/rewards/modals/TopAPI')
)
registerLazyModal('Share', () =>
  import('components/share-modal/ShareModal').then((m) => ({
    default: m.ShareModal
  }))
)
registerLazyModal('UploadConfirmation', () =>
  import('components/upload-confirmation-modal/UploadConfirmationModal').then(
    (m) => ({
      default: m.UploadConfirmationModal
    })
  )
)
registerLazyModal(
  'TiersExplainer',
  () => import('components/user-badges/TierExplainerModal')
)
registerLazyModal('WaitForDownloadModal', () =>
  import('components/wait-for-download-modal/WaitForDownloadModal').then(
    (m) => ({
      default: m.WaitForDownloadModal
    })
  )
)
registerLazyModal('Welcome', () =>
  import('components/welcome-modal/WelcomeModal').then((m) => ({
    default: m.WelcomeModal
  }))
)
registerLazyModal('ChatBlastModal', () =>
  import('pages/chat-page/components/ChatBlastModal').then((m) => ({
    default: m.ChatBlastModal
  }))
)
