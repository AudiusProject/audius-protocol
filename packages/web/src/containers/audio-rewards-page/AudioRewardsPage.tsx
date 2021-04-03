import React, { useContext, useEffect } from 'react'

import Header from 'components/general/header/desktop/Header'
import Page from 'components/general/Page'

import styles from './AudioRewardsPage.module.css'
import WalletModal from './WalletModal'
import Tiers from './Tiers'
import { BalanceTile, WalletTile } from './Tiles'
import ExplainerTile from './components/ExplainerTile'
import RewardsTile from './RewardsTile'
import { isMobile } from 'utils/clientUtil'
import { useMobileHeader } from 'components/general/header/mobile/hooks'
import MobilePageContainer from 'components/general/MobilePageContainer'
import { AUDIO_PAGE, BASE_URL, TRENDING_PAGE } from 'utils/route'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import NavContext, {
  LeftPreset,
  RightPreset
} from 'containers/nav/store/context'
import { useRequiresAccount } from 'hooks/useRequiresAccount'

export const messages = {
  title: '$AUDIO & Rewards',
  description: 'View important stats like plays, reposts, and more.'
}

export const RewardsContent = () => {
  const wm = useWithMobileStyle(styles.mobile)
  useRequiresAccount(TRENDING_PAGE)
  return (
    <>
      <ExplainerTile className={wm(styles.explainerTile)} />
      <WalletModal />
      <div className={wm(styles.cryptoContentContainer)}>
        <BalanceTile className={wm(styles.balanceTile)} />
        <WalletTile className={styles.walletTile} />
      </div>
      <RewardsTile className={styles.mobile} />
      <Tiers />
    </>
  )
}

export const DesktopPage = ({ children }: { children: React.ReactNode }) => {
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

export const MobilePage = ({ children }: { children: React.ReactNode }) => {
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
  const Page = isMobile() ? MobilePage : DesktopPage
  return (
    <Page>
      <RewardsContent />
    </Page>
  )
}

export default AudioRewardsPage
