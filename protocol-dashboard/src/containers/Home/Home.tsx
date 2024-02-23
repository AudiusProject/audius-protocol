import React from 'react'

import Logo from 'assets/img/audiusLogoHorizontal.svg?react'
import ApiCallsStat from 'components/ApiCallsStat'
import EstimatedAnnualStat from 'components/EstimatedAnnualStat'
import EstimatedWeeklyStat from 'components/EstimatedWeeklyStat'
import Loading from 'components/Loading'
import ManageService from 'components/ManageService'
import Page from 'components/Page'
import Paper from 'components/Paper'
import Proposal from 'components/Proposal'
import { NoProposals } from 'components/Proposals'
import TopAddressesTable from 'components/TopAddressesTable'
import TotalStakedStat from 'components/TotalStakedStat'
import UniqueUsersStat from 'components/UniqueUsersStat'
import { useAccount } from 'store/account/hooks'
import { useProposals } from 'store/cache/proposals/hooks'
import { usePushRoute } from 'utils/effects'
import { useIsMobile } from 'utils/hooks'
import { createStyles } from 'utils/mobile'
import { GOVERNANCE } from 'utils/routes'

import desktopStyles from './Home.module.css'
import mobileStyles from './HomeMobile.module.css'

const styles = createStyles({ desktopStyles, mobileStyles })

const messages = {
  title: 'Overview',
  recentProposals: 'Recent Proposals',
  noProposals: 'No Recent Proposals',
  viewAllProposals: 'View All Proposals',
  wtfIsAudius: 'WTF is Audius?',
  wtf1: `Audius is a digital streaming service that connects fans directly with artists and exclusive new music`,
  wtf2: `It does this by being fully decentralized: Audius is owned and run by a vibrant, open-source community of artists, fans, and developers all around the world. Audius gives artists the power to share never-before-heard music and monetize streams directly. Developers can build their own apps on top of Audius, giving them access to one of the most unique audio catalogs in existence.`,
  wtf3: `Backed by an all-star team of investors, Audius was founded in 2018 and serves millions of users every month, making it the largest non-financial crypto application ever built.`
}

const Home = () => {
  const { isLoggedIn } = useAccount()
  const { recentProposals } = useProposals()
  const pushRoute = usePushRoute()
  const isMobile = useIsMobile()

  return (
    <Page title={messages.title} hidePreviousPage>
      <div className={styles.statBar}>
        <TotalStakedStat />
        <ApiCallsStat />
        <UniqueUsersStat />
      </div>
      <div className={styles.rewards}>
        <EstimatedWeeklyStat />
        <EstimatedAnnualStat />
      </div>
      {isLoggedIn && (
        <div className={styles.manageServices}>
          <ManageService />
        </div>
      )}

      <Paper className={styles.proposals}>
        <div className={styles.title}>{messages.recentProposals}</div>
        <div className={styles.list}>
          {recentProposals ? (
            recentProposals.length > 0 ? (
              recentProposals.map((proposal, i) => (
                <Proposal key={i} proposal={proposal} />
              ))
            ) : (
              <NoProposals text={messages.noProposals} />
            )
          ) : (
            <Loading className={styles.loading} />
          )}
        </div>
        <div onClick={() => pushRoute(GOVERNANCE)} className={styles.moreText}>
          {messages.viewAllProposals}
        </div>
      </Paper>

      <TopAddressesTable
        limit={5}
        className={styles.topAddressesTable}
        alwaysShowMore
      />

      <Paper className={styles.wtf}>
        <div className={styles.bg} />
        {isMobile ? (
          <div className={styles.topRow}>
            <Logo className={styles.logo} />
            <div className={styles.wtfIs}>{messages.wtfIsAudius}</div>
          </div>
        ) : (
          <div className={styles.topRow}>
            <div className={styles.wtfIs}>{messages.wtfIsAudius}</div>
            <Logo className={styles.logo} />
          </div>
        )}
        <div className={styles.body}>
          <p>{messages.wtf1}</p>
          <p>{messages.wtf2}</p>
          <p>{messages.wtf3}</p>
        </div>
      </Paper>
    </Page>
  )
}

export default Home
