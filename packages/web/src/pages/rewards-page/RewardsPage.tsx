import { ReactNode, useContext, useEffect } from 'react'

import { StringKeys } from '@audius/common/services'
import { tokenDashboardPageActions, walletActions } from '@audius/common/store'
import { route } from '@audius/common/utils'
import { IconGift } from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { Header } from 'components/header/desktop/Header'
import { useMobileHeader } from 'components/header/mobile/hooks'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import NavContext, {
  LeftPreset,
  RightPreset
} from 'components/nav/mobile/NavContext'
import Page from 'components/page/Page'
import { HCaptchaModal } from 'components/rewards/modals/HCaptchaModal'
import { useIsMobile } from 'hooks/useIsMobile'
import { useRemoteVar } from 'hooks/useRemoteConfig'
import { useRequiresAccount } from 'hooks/useRequiresAccount'
import { BASE_URL } from 'utils/route'

import styles from './RewardsPage.module.css'
import Tiers from './Tiers'
import { ChallengeRewardsTile } from './components/ChallengeRewards/ChallengeRewardsTile'
import { TrendingRewardsTile } from './components/TrendingRewards/TrendingRewardsTile'
const { REWARDS_PAGE, TRENDING_PAGE } = route
const { getBalance } = walletActions
const { preloadWalletProviders } = tokenDashboardPageActions

const messages = {
  title: 'Rewards & Perks',
  description: 'Earn $AUDIO by completing simple tasks while using Audius'
}

const RewardsContent = () => {
  const audioFeaturesDegradedText = useRemoteVar(
    StringKeys.AUDIO_FEATURES_DEGRADED_TEXT
  )

  useRequiresAccount(TRENDING_PAGE)

  return (
    <>
      {audioFeaturesDegradedText ? (
        <div className={styles.topBanner}>
          <span className={styles.topBannerText}>
            {audioFeaturesDegradedText}
          </span>
        </div>
      ) : null}
      <ChallengeRewardsTile className={styles.mobile} />
      <TrendingRewardsTile className={styles.mobile} />
      <Tiers />
    </>
  )
}

const DesktopPage = ({ children }: { children: ReactNode }) => {
  const dispatch = useDispatch()
  useEffect(() => {
    dispatch(preloadWalletProviders())
  }, [dispatch])
  const header = <Header icon={IconGift} primary={messages.title} />
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
      canonicalUrl={`${BASE_URL}${REWARDS_PAGE}`}
      hasDefaultHeader
      containerClassName={styles.rewardsMobilePageContainer}
    >
      {children}
    </MobilePageContainer>
  )
}

export const RewardsPage = () => {
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
