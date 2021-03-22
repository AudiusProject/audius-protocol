import React from 'react'

import Header from 'components/general/header/desktop/Header'
import Page from 'components/general/Page'

import styles from './AudioRewardsPage.module.css'
import WalletModal from './WalletModal'
import Tiers from './Tiers'
import { ClaimTile, WalletTile } from './Tiles'
import ExplainerTile from './components/ExplainerTile'

export const messages = {
  title: '$AUDIO & Rewards',
  description: 'View important stats like plays, reposts, and more.'
}

export const AudioRewardsPage = () => {
  const header = <Header primary={messages.title} />
  return (
    <Page
      title={messages.title}
      description={messages.description}
      contentClassName={styles.pageContainer}
      header={header}
    >
      <ExplainerTile className={styles.explainerTile} />
      <WalletModal />
      <div className={styles.cryptoContentContainer}>
        <ClaimTile className={styles.claimTile} />
        <WalletTile />
      </div>
      <Tiers />
    </Page>
  )
}

export default AudioRewardsPage
