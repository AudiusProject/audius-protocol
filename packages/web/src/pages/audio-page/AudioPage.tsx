import { ReactNode, useContext, useEffect } from 'react'

import { StringKeys } from '@audius/common/services'
import { WALLET_AUDIO_PAGE } from '@audius/common/src/utils/route'
import { route } from '@audius/common/utils'
import { Flex } from '@audius/harmony'
import { useLocation } from 'react-router-dom'

import { Header } from 'components/header/desktop/Header'
import { useMobileHeader } from 'components/header/mobile/hooks'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import NavContext, {
  LeftPreset,
  RightPreset
} from 'components/nav/mobile/NavContext'
import Page from 'components/page/Page'
import { useIsMobile } from 'hooks/useIsMobile'
import { useRemoteVar } from 'hooks/useRemoteConfig'
import { useRequiresAccount } from 'hooks/useRequiresAccount'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { ClaimAllRewardsPanel } from 'pages/rewards-page/components/ClaimAllRewardsPanel'
import { BASE_URL } from 'utils/route'

import styles from './AudioPage.module.css'
import { AudioWalletTransactions } from './AudioWalletTransactions'
import WalletModal from './WalletModal'
import ExplainerTile from './components/ExplainerTile'
import { WalletManagementTile } from './components/WalletManagementTile'
const { AUDIO_PAGE, TRENDING_PAGE } = route

const messages = {
  title: '$AUDIO Wallet',
  description: 'Complete tasks to earn $AUDIO tokens!'
}

const RewardsContent = () => {
  const wm = useWithMobileStyle(styles.mobile)

  const audioFeaturesDegradedText = useRemoteVar(
    StringKeys.AUDIO_FEATURES_DEGRADED_TEXT
  )

  useRequiresAccount(TRENDING_PAGE)

  return (
    <Flex column gap='2xl'>
      <WalletModal />
      {audioFeaturesDegradedText ? (
        <div className={styles.topBanner}>
          <span className={styles.topBannerText}>
            {audioFeaturesDegradedText}
          </span>
        </div>
      ) : null}
      <ClaimAllRewardsPanel />
      <WalletManagementTile />
      <AudioWalletTransactions />
      <ExplainerTile className={wm(styles.explainerTile)} />
    </Flex>
  )
}

const DesktopPage = ({ children }: { children: ReactNode }) => {
  const location = useLocation()

  const showBackButton = location.pathname === WALLET_AUDIO_PAGE

  const header = (
    <Header primary={messages.title} showBackButton={showBackButton} />
  )
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

export const AudioPage = () => {
  const isMobile = useIsMobile()
  const Page = isMobile ? MobilePage : DesktopPage
  return (
    <Page>
      <RewardsContent />
    </Page>
  )
}
