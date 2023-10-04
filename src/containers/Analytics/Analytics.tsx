import React from 'react'

import desktopStyles from './Analytics.module.css'
import mobileStyles from './AnalyticsMobile.module.css'
import Page from '../../components/Page'
import TotalStakedStat from '../../components/TotalStakedStat'
import ApiCallsStat from '../../components/ApiCallsStat'
import UniqueUsersStat from '../../components/UniqueUsersStat'
import TotalApiCallsChart from '../../components/TotalApiCallsChart'
import PlaysChart from '../../components/PlaysChart'
import UniqueUsersChart from '../../components/UniqueUsersChart'
import TotalStakedChart from '../../components/TotalStakedChart'
import TopAppsChart from '../../components/TopAppsChart'
import TopGenresChart from '../../components/TopGenresChart'
import TopTracks from '../../components/TopTracks'
import TopPlaylists from '../../components/TopPlaylists'
import TopAlbums from '../../components/TopAlbums'
import { createStyles } from '../../utils/mobile'

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
