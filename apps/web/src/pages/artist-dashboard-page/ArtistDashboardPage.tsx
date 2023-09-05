import React, {
  Suspense,
  Component,
  useMemo,
  ReactNode,
  useCallback,
  useState
} from 'react'

import {
  ID,
  Status,
  Theme,
  Track,
  User,
  formatCount,
  themeSelectors,
  FeatureFlags
} from '@audius/common'
import { IconFilter, IconNote, IconHidden } from '@audius/stems'
import cn from 'classnames'
import { push as pushRoute } from 'connected-react-router'
import { each } from 'lodash'
import moment, { Moment } from 'moment'
import { connect, useDispatch, useSelector } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Dispatch } from 'redux'

import Header from 'components/header/desktop/Header'
import { Input } from 'components/input'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import Page from 'components/page/Page'
import { TestTracksTable } from 'components/test-tracks-table'
import { TracksTableColumn } from 'components/test-tracks-table/TestTracksTable'
import TableOptionsButton from 'components/tracks-table/TableOptionsButton'
import TracksTable, { alphaSortFn } from 'components/tracks-table/TracksTable'
import { useFlag } from 'hooks/useRemoteConfig'
import useTabs, { useTabRecalculator } from 'hooks/useTabs/useTabs'
import { getFeatureEnabled } from 'services/remote-config/featureFlagHelpers'
import { AppState } from 'store/types'
import lazyWithPreload from 'utils/lazyWithPreload'
import { profilePage, TRENDING_PAGE } from 'utils/route'
import { withClassNullGuard } from 'utils/withNullGuard'

import styles from './ArtistDashboardPage.module.css'
import ArtistProfile from './components/ArtistProfile'
import {
  fetchDashboard,
  fetchDashboardListenData,
  fetchDashboardTracks,
  resetDashboard
} from './store/actions'
import {
  getDashboardListenData,
  getDashboardStatus,
  getDashboardTracksStatus,
  makeGetDashboard
} from './store/selectors'
const { getTheme } = themeSelectors

const TotalPlaysChart = lazyWithPreload(
  () => import('./components/TotalPlaysChart')
)

const StatTile = (props: { title: string; value: any }) => {
  return (
    <div className={styles.statTileContainer}>
      <span className={styles.statValue}>{formatCount(props.value)}</span>
      <span className={styles.statTitle}>{props.title}</span>
    </div>
  )
}

const getNumericColumn = (field: any, overrideTitle?: string) => {
  const title = field.charAt(0).toUpperCase() + field.slice(1).toLowerCase()
  return {
    title: overrideTitle || title,
    dataIndex: field,
    key: field,
    className: cn(styles.numericColumn, `col${title}`),
    width: 63,
    sorter: (a: any, b: any) => a[field] - b[field],
    render: (val: any) => formatCount(val)
  }
}

type DataSourceTrack = Track & {
  key: string
  name: string
  date: string
  time?: number
  saves: number
  reposts: number
  plays: number
}

type TracksTableProps = {
  onClickRow: (record: any) => void
  unlistedDataSource: DataSourceTrack[]
  listedDataSource: DataSourceTrack[]
  account: User
}

export const messages = {
  publicTracksTabTitle: 'PUBLIC TRACKS',
  unlistedTracksTabTitle: 'HIDDEN TRACKS',
  filterInputPlacehoder: 'Filter Tracks',
  thisYear: 'This Year'
}

const makeColumns = (account: User, isUnlisted: boolean) => {
  let columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 350,
      className: cn(styles.col, 'colName'),
      sorter: (a: any, b: any) => alphaSortFn(a.name, b.name),
      render: (val: string, record: DataSourceTrack) => (
        <div className={styles.trackName}>
          {val}
          {record.is_delete ? ' [Deleted By Artist]' : ''}
        </div>
      )
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 50,
      className: cn(styles.col, 'colDate'),
      render: (val: any) => moment(val).format('M/D/YY'),
      sorter: (a: any, b: any) => moment(a.date).diff(moment(b.date))
    },
    getNumericColumn('plays')
  ]

  if (!isUnlisted) {
    columns = [
      ...columns,
      getNumericColumn('saves', 'favorites'),
      getNumericColumn('reposts')
    ]
  }

  const overflowColumn = {
    title: '',
    key: 'optionsButton',
    className: styles.overflowContainer,
    render: (val: any, record: any, index: number) => {
      return (
        <div className={styles.overflowAdjustment}>
          <TableOptionsButton
            isDeleted={record.is_delete}
            includeEdit={false}
            handle={account.handle}
            trackId={val.track_id}
            isFavorited={val.has_current_user_saved}
            isOwner
            isArtistPick={account._artist_pick === val.track_id}
            isUnlisted={record.is_unlisted}
            index={index}
            trackTitle={val.name}
            trackPermalink={val.permalink}
            hiddenUntilHover={false}
            includeEmbed={!isUnlisted && !record.is_delete}
            includeAddToPlaylist={!isUnlisted}
            includeArtistPick={!isUnlisted}
          />
        </div>
      )
    }
  }

  return [...columns, overflowColumn]
}

const tableColumns: TracksTableColumn[] = [
  'spacer',
  'trackName',
  'releaseDate',
  'length',
  'plays',
  'reposts',
  'overflowMenu'
]

// Pagination Constants
const tablePageSize = 50

const TracksTableContainer = ({
  onClickRow,
  listedDataSource,
  unlistedDataSource,
  account
}: TracksTableProps) => {
  const [filterText, setFilterText] = useState('')
  const { isEnabled: isNewTablesEnabled } = useFlag(FeatureFlags.NEW_TABLES)
  const dispatch = useDispatch()
  const tracksStatus = useSelector(getDashboardTracksStatus)
  const tabRecalculator = useTabRecalculator()

  const tabHeaders = useMemo(
    () => [
      {
        text: messages.publicTracksTabTitle,
        icon: <IconNote />,
        label: messages.publicTracksTabTitle
      },
      {
        text: messages.unlistedTracksTabTitle,
        icon: <IconHidden />,
        label: messages.unlistedTracksTabTitle,
        disabled: !unlistedDataSource.length,
        disabledTooltipText: 'You have no hidden tracks'
      }
    ],
    [unlistedDataSource]
  )

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setFilterText(val)
  }

  const filteredListedData = listedDataSource.filter((data) =>
    data.title.toLowerCase().includes(filterText.toLowerCase())
  )

  const filteredUnlistedData = unlistedDataSource.filter((data) =>
    data.title.toLowerCase().includes(filterText.toLowerCase())
  )

  const handleFetchPage = useCallback(
    (page: number) => {
      dispatch(fetchDashboardTracks(page * tablePageSize, tablePageSize))
    },
    [dispatch]
  )

  const tabElements = useMemo(
    () => [
      <div
        key='listed'
        className={cn(styles.sectionContainer, styles.tabBodyWrapper)}
      >
        {isNewTablesEnabled ? (
          <TestTracksTable
            data={filteredListedData}
            columns={tableColumns}
            onClickRow={onClickRow}
            onClickTrackName={onClickRow}
            loading={tracksStatus === Status.LOADING}
            fetchPage={handleFetchPage}
            pageSize={tablePageSize}
            userId={account.user_id}
            showMoreLimit={5}
            onShowMoreToggle={tabRecalculator.recalculate}
            totalRowCount={account.track_count}
            isPaginated
          />
        ) : (
          <TracksTable
            dataSource={filteredListedData}
            limit={5}
            columns={makeColumns(account, false)}
            onClickRow={onClickRow}
            didToggleShowTracks={() => tabRecalculator.recalculate()}
            animateTransitions={false}
          />
        )}
      </div>,
      <div
        key='unlisted'
        className={cn(styles.sectionContainer, styles.tabBodyWrapper)}
      >
        {isNewTablesEnabled ? (
          <TestTracksTable
            data={filteredUnlistedData}
            columns={tableColumns}
            onClickRow={onClickRow}
            onClickTrackName={onClickRow}
            loading={tracksStatus === Status.LOADING}
            fetchPage={handleFetchPage}
            pageSize={tablePageSize}
            showMoreLimit={5}
            userId={account.user_id}
            onShowMoreToggle={tabRecalculator.recalculate}
            totalRowCount={account.track_count}
            isPaginated
          />
        ) : (
          <TracksTable
            dataSource={filteredUnlistedData}
            limit={5}
            columns={makeColumns(account, true)}
            onClickRow={onClickRow}
            didToggleShowTracks={() => tabRecalculator.recalculate()}
            animateTransitions={false}
          />
        )}
      </div>
    ],
    [
      account,
      filteredListedData,
      filteredUnlistedData,
      handleFetchPage,
      isNewTablesEnabled,
      onClickRow,
      tabRecalculator,
      tracksStatus
    ]
  )

  const { tabs, body } = useTabs({
    bodyClassName: styles.tabBody,
    isMobile: false,
    tabRecalculator,
    tabs: tabHeaders,
    elements: tabElements
  })

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tabBorderProvider}>
        <div className={styles.filterInputContainer}>
          <Input
            placeholder={messages.filterInputPlacehoder}
            prefix={<IconFilter />}
            onChange={handleFilterChange}
            value={filterText}
            size='small'
            variant='bordered'
          />
        </div>
        <div className={styles.tabContainer}>{tabs}</div>
      </div>
      {body}
    </div>
  )
}

type ArtistDashboardPageProps = ReturnType<typeof mapDispatchToProps> &
  ReturnType<ReturnType<typeof makeMapStateToProps>> &
  RouteComponentProps

const mapper = (props: ArtistDashboardPageProps) => {
  const { account } = props
  return { ...props, account }
}

export class ArtistDashboardPage extends Component<
  NonNullable<ReturnType<typeof mapper>>
> {
  state = {
    selectedTrack: -1 // all tracks
  }

  componentDidMount() {
    const newTablesEnabled = getFeatureEnabled(FeatureFlags.NEW_TABLES) ?? false
    this.props.fetchDashboard(0, newTablesEnabled ? tablePageSize : 500)
    TotalPlaysChart.preload()
  }

  componentDidUpdate() {
    const { account } = this.props
    if (account) {
      const { track_count = 0 } = account
      if (!(track_count > 0)) {
        this.props.goToRoute(TRENDING_PAGE)
      }
    }
  }

  componentWillUnmount() {
    this.props.resetDashboard()
  }

  formatMetadata(trackMetadatas: Track[]): DataSourceTrack[] {
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

  onClickRow = (record: any) => {
    const { account, goToRoute } = this.props
    if (!account) return
    goToRoute(record.permalink)
  }

  onSetTrackOption = (trackId: ID) => {
    this.setState({ selectedTrack: trackId })
  }

  onSetYearOption = (year: string) => {
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
    this.props.fetchDashboardListenData(
      this.props.tracks.map((t) => t.track_id),
      start.toISOString(),
      end.toISOString()
    )
  }

  renderCreatorContent() {
    const { account, listenData, tracks, unlistedTracks, stats, isMatrix } =
      this.props
    const trackCount = this.props.account?.track_count || 0
    if (!account || !(trackCount > 0)) return null

    const { selectedTrack } = this.state

    const statTiles: ReactNode[] = []
    each(stats, (stat, title) =>
      statTiles.push(<StatTile key={title} title={title} value={stat} />)
    )

    const chartData =
      selectedTrack === -1 ? listenData.all : listenData[selectedTrack]

    const chartTracks = tracks.map((track: any) => ({
      id: track.track_id,
      name: track.title
    }))

    const listedDataSource = this.formatMetadata(tracks)
    const unlistedDataSource = this.formatMetadata(unlistedTracks)
    return (
      <>
        <div className={styles.sectionContainer}>
          <Suspense fallback={<div className={styles.chartFallback} />}>
            <TotalPlaysChart
              data={chartData}
              isMatrix={isMatrix}
              tracks={chartTracks}
              selectedTrack={selectedTrack}
              onSetYearOption={this.onSetYearOption}
              onSetTrackOption={this.onSetTrackOption}
              accountCreatedAt={account.created_at}
            />
          </Suspense>
        </div>
        <div className={cn(styles.sectionContainer, styles.statsContainer)}>
          {statTiles}
        </div>
        <div className={styles.tracksTableWrapper}>
          <TracksTableContainer
            onClickRow={this.onClickRow}
            listedDataSource={listedDataSource}
            unlistedDataSource={unlistedDataSource}
            account={account}
          />
        </div>
      </>
    )
  }

  renderProfileSection() {
    const { account, goToRoute } = this.props
    if (!account) return null

    return (
      <div className={styles.profileContainer}>
        <ArtistProfile
          userId={account.user_id}
          profilePictureSizes={account._profile_picture_sizes}
          isVerified={account.is_verified}
          name={account.name}
          handle={account.handle}
          onViewProfile={() => goToRoute(profilePage(account.handle))}
        />
      </div>
    )
  }

  render() {
    const { account, status } = this.props
    const header = <Header primary='Dashboard' />

    return (
      <Page
        title='Dashboard'
        description='View important stats like plays, reposts, and more.'
        contentClassName={styles.pageContainer}
        header={header}
      >
        {!account || status === Status.LOADING ? (
          <LoadingSpinner className={styles.spinner} />
        ) : (
          <>
            {this.renderProfileSection()}
            {this.renderCreatorContent()}
          </>
        )}
      </Page>
    )
  }
}

const makeMapStateToProps = () => {
  const getDashboard = makeGetDashboard()
  return (state: AppState) => ({
    ...getDashboard(state),
    listenData: getDashboardListenData(state),
    status: getDashboardStatus(state),
    isMatrix: getTheme(state) === Theme.MATRIX
  })
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  fetchDashboard: (offset?: number, limit?: number) =>
    dispatch(fetchDashboard(offset, limit)),
  fetchDashboardListenData: (trackIds: ID[], start: string, end: string) =>
    dispatch(fetchDashboardListenData(trackIds, start, end, 'month')),
  resetDashboard: () => dispatch(resetDashboard()),
  goToRoute: (route: string) => dispatch(pushRoute(route))
})

const g = withClassNullGuard(mapper)

export default withRouter(
  connect(makeMapStateToProps, mapDispatchToProps)(g(ArtistDashboardPage))
)
