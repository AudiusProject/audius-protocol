import React from 'react'

import ApiCallsStat from 'components/ApiCallsStat'
import Page from 'components/Page'
import PlaysChart from 'components/PlaysChart'
import TopAlbums from 'components/TopAlbums'
import TopAppsChart from 'components/TopAppsChart'
import TopGenresChart from 'components/TopGenresChart'
import TopPlaylists from 'components/TopPlaylists'
import TopTracks from 'components/TopTracks'
import TotalApiCallsChart from 'components/TotalApiCallsChart'
import TotalStakedChart from 'components/TotalStakedChart'
import TotalStakedStat from 'components/TotalStakedStat'
import UniqueUsersChart from 'components/UniqueUsersChart'
import UniqueUsersStat from 'components/UniqueUsersStat'
import { createStyles } from 'utils/mobile'

import desktopStyles from './Analytics.module.css'
import mobileStyles from './AnalyticsMobile.module.css'

const styles = createStyles({ desktopStyles, mobileStyles })

const messages = {
  title: 'Analytics'
}

type OwnProps = {}
type AnalyticsProps = OwnProps

const Analytics: React.FC<AnalyticsProps> = () => {
  return (
    <Page title={messages.title} className={styles.container} hidePreviousPage>
      <div className={styles.statBar}>
        <TotalStakedStat />
        <ApiCallsStat />
        <UniqueUsersStat />
      </div>
      <div className={styles.big}>
        <TotalApiCallsChart />
      </div>
      <div className={styles.big}>
        <TotalStakedChart />
      </div>
      <div className={styles.section}>
        <PlaysChart />
        <UniqueUsersChart />
      </div>
      <div className={styles.section}>
        <TopAppsChart />
        <TopGenresChart />
      </div>
      <div className={styles.medium}>
        <TopTracks />
      </div>
      <div className={styles.section}>
        <TopAlbums />
        <TopPlaylists />
      </div>
    </Page>
  )
}

export default Analytics
