import { useState, Suspense, ReactNode, useEffect, useCallback } from 'react'

import { themeSelectors } from '@audius/common'
import { Status, Track } from '@audius/common/models'
import { formatCount } from '@audius/common/utils'
import cn from 'classnames'
import { each } from 'lodash'
import moment, { Moment } from 'moment'
import { useDispatch, useSelector } from 'react-redux'

import Header from 'components/header/desktop/Header'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import Page from 'components/page/Page'
import { useGoToRoute } from 'hooks/useGoToRoute'
import lazyWithPreload from 'utils/lazyWithPreload'

import styles from './DashboardPage.module.css'
import { ArtistCard } from './components/ArtistCard'
import {
  TracksTableContainer,
  DataSourceTrack,
  tablePageSize
} from './components/TracksTableContainer'
import {
  getDashboardListenData,
  getDashboardStatus,
  makeGetDashboard
} from './store/selectors'
import { fetch, reset, fetchListenData } from './store/slice'

const { getTheme } = themeSelectors

const TotalPlaysChart = lazyWithPreload(
  () => import('./components/TotalPlaysChart')
)

export const messages = {
  title: 'Artist Dashboard',
  description: 'View important stats like plays, reposts, and more.',
  thisYear: 'This Year'
}

const formatMetadata = (trackMetadatas: Track[]): DataSourceTrack[] => {
  return trackMetadatas
    .map((metadata, i) => ({
      ...metadata,
      key: `${metadata.title}_${metadata.dateListened}_${i}`,
      name: metadata.title,
      date: metadata.created_at,
      time: metadata.duration,
      saves: metadata.save_count,
      reposts: metadata.repost_count,
      plays: metadata.play_count
    }))
    .filter((meta) => !meta.is_invalid)
}

const StatTile = (props: { title: string; value: any }) => {
  return (
    <div className={styles.statTileContainer}>
      <span className={styles.statValue}>{formatCount(props.value)}</span>
      <span className={styles.statTitle}>{props.title}</span>
    </div>
  )
}

export const DashboardPage = () => {
  const goToRoute = useGoToRoute()
  const dispatch = useDispatch()
  const [selectedTrack, setSelectedTrack] = useState(-1)
  const { account, tracks, stats } = useSelector(makeGetDashboard())
  const listenData = useSelector(getDashboardListenData)
  const dashboardStatus = useSelector(getDashboardStatus)
  const theme = useSelector(getTheme)

  const header = <Header primary={messages.title} />

  useEffect(() => {
    dispatch(fetch({ offset: 0, limit: tablePageSize }))
    TotalPlaysChart.preload()
    return () => {
      dispatch(reset({}))
    }
  }, [dispatch])

  const onClickRow = useCallback(
    (record: any) => {
      if (!account) return
      goToRoute(record.permalink)
    },
    [account, goToRoute]
  )

  const onSetYearOption = useCallback(
    (year: string) => {
      let start: Moment
      let end: Moment
      if (year === messages.thisYear) {
        const now = moment()
        start = now.clone().subtract(1, 'years')
        end = now
      } else {
        start = moment('01/01/' + year)
        end = start.clone().add(1, 'year')
      }
      dispatch(
        fetchListenData({
          trackIds: tracks.map((t) => t.track_id),
          start: start.toISOString(),
          end: end.toISOString(),
          period: 'month'
        })
      )
    },
    [dispatch, tracks]
  )

  const renderChart = useCallback(() => {
    const trackCount = account?.track_count || 0
    if (!account || !(trackCount > 0) || !listenData) return null

    const chartData =
      selectedTrack === -1 ? listenData.all : listenData[selectedTrack]

    const chartTracks = tracks.map((track: any) => ({
      id: track.track_id,
      name: track.title
    }))

    return (
      <Suspense fallback={<div className={styles.chartFallback} />}>
        <TotalPlaysChart
          data={chartData}
          theme={theme}
          tracks={chartTracks}
          selectedTrack={selectedTrack}
          onSetYearOption={onSetYearOption}
          onSetTrackOption={setSelectedTrack}
          accountCreatedAt={account.created_at}
        />
      </Suspense>
    )
  }, [account, theme, listenData, onSetYearOption, selectedTrack, tracks])

  const renderStats = useCallback(() => {
    if (!account) return null

    const statTiles: ReactNode[] = []
    each(stats, (stat, title) =>
      statTiles.push(<StatTile key={title} title={title} value={stat} />)
    )

    return <div className={styles.statsContainer}>{statTiles}</div>
  }, [account, stats])

  const renderTable = useCallback(() => {
    const trackCount = account?.track_count || 0
    if (!account || !(trackCount > 0)) return null

    const dataSource = formatMetadata(tracks)
    return (
      <div className={styles.tracksTableWrapper}>
        <TracksTableContainer
          onClickRow={onClickRow}
          dataSource={dataSource}
          account={account}
        />
      </div>
    )
  }, [account, onClickRow, tracks])

  return (
    <Page
      title={messages.title}
      description={messages.description}
      contentClassName={styles.pageContainer}
      header={header}
    >
      {!account || !listenData || dashboardStatus === Status.LOADING ? (
        <LoadingSpinner className={styles.spinner} />
      ) : (
        <>
          <div
            className={cn(styles.sectionContainer, styles.topSection, {
              [styles.isArtist]: account.track_count > 0
            })}
          >
            <ArtistCard
              userId={account.user_id}
              handle={account.handle}
              name={account.name}
            />
          </div>
          <div className={styles.sectionContainer}>
            {renderChart()}
            {renderStats()}
            {renderTable()}
          </div>
        </>
      )}
    </Page>
  )
}
