import React from 'react'

import IconChart from 'assets/img/iconChart.svg?react'
import Page from 'components/Page'
import PlaysChart from 'components/PlaysChart'
import TopAlbums from 'components/TopAlbums'
import TopAppsChart from 'components/TopAppsChart'
import TopGenresChart from 'components/TopGenresChart'
import TopPlaylists from 'components/TopPlaylists'
import TopTracks from 'components/TopTracks'
import TotalApiCallsChart from 'components/TotalApiCallsChart'
import TotalStakedChart from 'components/TotalStakedChart'
import UniqueUsersChart from 'components/UniqueUsersChart'
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
    <Page icon={IconChart} title={messages.title} className={styles.container}>
      <div className={styles.big}>
        <TotalApiCallsChart />
      </div>
      <div className={styles.section}>
        <TotalStakedChart />
        <UniqueUsersChart />
      </div>
      <div className={styles.big}>
        <PlaysChart />
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
