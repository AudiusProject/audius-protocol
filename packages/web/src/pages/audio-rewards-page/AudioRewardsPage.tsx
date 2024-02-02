import { ReactNode, useContext, useEffect } from 'react'

import { StringKeys, FeatureFlags } from '@audius/common/services'
import { tokenDashboardPageActions, walletActions } from '@audius/common/store'
import { useDispatch } from 'react-redux'

import Header from 'components/header/desktop/Header'
import { useMobileHeader } from 'components/header/mobile/hooks'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import NavContext, {
  LeftPreset,
  RightPreset
} from 'components/nav/store/context'
import Page from 'components/page/Page'
import { useIsMobile } from 'hooks/useIsMobile'
import { useFlag, useRemoteVar } from 'hooks/useRemoteConfig'
import { useRequiresAccount } from 'hooks/useRequiresAccount'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { AUDIO_PAGE, BASE_URL, TRENDING_PAGE } from 'utils/route'

import styles from './AudioRewardsPage.module.css'
import ChallengeRewardsTile from './ChallengeRewardsTile'
import Tiers from './Tiers'
import { BalanceTile, WalletTile } from './Tiles'
import TrendingRewardsTile from './TrendingRewardsTile'
import WalletModal from './WalletModal'
import ExplainerTile from './components/ExplainerTile'
import { WalletManagementTile } from './components/WalletManagementTile'
const { getBalance } = walletActions
const { preloadWalletProviders } = tokenDashboardPageActions

const messages = {
  title: '$AUDIO & Rewards',
  description: 'Complete tasks to earn $AUDIO tokens!'
}

const RewardsContent = () => {
  const wm = useWithMobileStyle(styles.mobile)

  const { isEnabled: isChallengeRewardsEnabled } = useFlag(
    FeatureFlags.CHALLENGE_REWARDS_UI
  )

  const { isEnabled: isCoinbaseEnabled } = useFlag(
    FeatureFlags.BUY_AUDIO_COINBASE_ENABLED
  )

  const { isEnabled: isStripeEnabled } = useFlag(
    FeatureFlags.BUY_AUDIO_STRIPE_ENABLED
  )

  const isBuyAudioEnabled = isCoinbaseEnabled || isStripeEnabled

  const audioFeaturesDegradedText = useRemoteVar(
    StringKeys.AUDIO_FEATURES_DEGRADED_TEXT
  )

  useRequiresAccount(TRENDING_PAGE)

  return (
    <>
      <WalletModal />
      {audioFeaturesDegradedText ? (
        <div className={styles.topBanner}>
          <span className={styles.topBannerText}>
            {audioFeaturesDegradedText}
          </span>
        </div>
      ) : null}
      {isBuyAudioEnabled ? (
        <WalletManagementTile />
      ) : (
        <>
          <div className={wm(styles.cryptoContentContainer)}>
            <BalanceTile className={wm(styles.balanceTile)} />
            <WalletTile className={styles.walletTile} />
          </div>
        </>
      )}
      {isChallengeRewardsEnabled && (
        <ChallengeRewardsTile className={styles.mobile} />
      )}
      <TrendingRewardsTile className={styles.mobile} />
      <Tiers />
      <ExplainerTile className={wm(styles.explainerTile)} />
    </>
  )
}

const DesktopPage = ({ children }: { children: ReactNode }) => {
  const dispatch = useDispatch()
  useEffect(() => {
    dispatch(preloadWalletProviders())
  }, [dispatch])
  const header = <Header primary={messages.title} />
  return (
    <Page
      title={messages.title}
      description={messages.description}
      contentClassName={styles.pageContainer}
      header={header}
    >
      {children}
    </Page>
  )
}

const useMobileNavContext = () => {
  useMobileHeader({ title: messages.title })
  const { setLeft, setRight } = useContext(NavContext)!
  useEffect(() => {
    setLeft(LeftPreset.BACK)
    setRight(RightPreset.SEARCH)
  }, [setLeft, setRight])
}

const MobilePage = ({ children }: { children: ReactNode }) => {
  useMobileNavContext()
  return (
    <MobilePageContainer
      title={messages.title}
      description={messages.description}
      canonicalUrl={`${BASE_URL}${AUDIO_PAGE}`}
      hasDefaultHeader
      containerClassName={styles.rewardsMobilePageContainer}
    >
      {children}
    </MobilePageContainer>
  )
}

export const AudioRewardsPage = () => {
  const dispatch = useDispatch()
  const isMobile = useIsMobile()
  useEffect(() => {
    dispatch(getBalance())
  }, [dispatch])
  const Page = isMobile ? MobilePage : DesktopPage
  return (
    <Page>
      <RewardsContent />
    </Page>
  )
}
