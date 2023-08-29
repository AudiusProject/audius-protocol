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
  formatCurrencyBalance,
  formatCount,
  themeSelectors,
  FeatureFlags
} from '@audius/common'
import {
  IconFilter,
  IconNote,
  IconHidden,
  IconKebabHorizontal,
  IconQuestionCircle,
  HarmonyButton,
  HarmonyButtonType,
  PopupMenu,
  PopupMenuItem,
  HarmonyPlainButton,
  HarmonyPlainButtonType
} from '@audius/stems'
import cn from 'classnames'
import { push as pushRoute } from 'connected-react-router'
import { each } from 'lodash'
import moment, { Moment } from 'moment'
import { connect, useDispatch, useSelector } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Dispatch } from 'redux'

import { Icon } from 'components/Icon'
import Header from 'components/header/desktop/Header'
import { Input } from 'components/input'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import Page from 'components/page/Page'
import { TracksTable, TracksTableColumn } from 'components/tracks-table'
import { Text } from 'components/typography'
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
  thisYear: 'This Year',
  usdc: 'USDC',
  earn: 'Earn USDC by selling your music',
  learnMore: 'Learn More',
  withdraw: 'Withdraw Funds',
  salesSummary: 'Sales Summary',
  withdrawalHistory: 'Withdrawal History'
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
        <TracksTable
          data={filteredListedData}
          disabledTrackEdit
          columns={tableColumns}
          onClickRow={onClickRow}
          loading={tracksStatus === Status.LOADING}
          fetchPage={handleFetchPage}
          pageSize={tablePageSize}
          userId={account.user_id}
          showMoreLimit={5}
          onShowMoreToggle={tabRecalculator.recalculate}
          totalRowCount={account.track_count}
          isPaginated
        />
      </div>,
      <div
        key='unlisted'
        className={cn(styles.sectionContainer, styles.tabBodyWrapper)}
      >
        <TracksTable
          data={filteredUnlistedData}
          disabledTrackEdit
          columns={tableColumns}
          onClickRow={onClickRow}
          loading={tracksStatus === Status.LOADING}
          fetchPage={handleFetchPage}
          pageSize={tablePageSize}
          showMoreLimit={5}
          userId={account.user_id}
          onShowMoreToggle={tabRecalculator.recalculate}
          totalRowCount={account.track_count}
          isPaginated
        />
      </div>
    ],
    [
      account,
      filteredListedData,
      filteredUnlistedData,
      handleFetchPage,
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

const USDCSection = ({ account }: { account: User }) => {
  if (!account) return null

  // TODO: wire up balance https://linear.app/audius/issue/PAY-1761/wire-up-usdc-balance-in-artist-dashboard
  const balance = 10.29

  const menuItems: PopupMenuItem[] = [
    {
      text: messages.salesSummary,
      // TODO: link to sales page https://linear.app/audius/issue/PAY-1763/wire-up-salespurchases-pages-on-artist-dashboard
      onClick: () => {}
    },
    {
      text: messages.withdrawalHistory,
      // TODO: link to withdraw history page https://linear.app/audius/issue/PAY-1763/wire-up-salespurchases-pages-on-artist-dashboard
      onClick: () => {}
    }
  ]

  return (
    <div className={styles.usdcContainer}>
      <div className={styles.backgroundBlueGradient}>
        <div className={styles.usdcTitleContainer}>
          <div className={styles.usdcTitle}>
            {/* TODO: update icon https://linear.app/audius/issue/PAY-1764/update-icons-in-usdc-tile */}
            <Icon icon={IconNote} size='xxxLarge' color='staticWhite' />
            <div className={styles.usdc}>
              <Text
                variant='heading'
                size='xxLarge'
                color='staticWhite'
                strength='strong'
              >
                {messages.usdc}
              </Text>
            </div>
          </div>
          <Text
            variant='heading'
            color='staticWhite'
            strength='strong'
            size='xxLarge'
          >
            ${formatCurrencyBalance(balance)}
          </Text>
        </div>
        <div className={styles.usdcInfo}>
          <Text color='staticWhite'>{messages.earn}</Text>
          <HarmonyPlainButton
            // TODO: wire up learn more link https://linear.app/audius/issue/PAY-1762/wire-up-learn-more-link
            onClick={() => {}}
            iconLeft={IconQuestionCircle}
            variant={HarmonyPlainButtonType.INVERTED}
            text={messages.learnMore}
          />
        </div>
      </div>
      <div className={styles.withdrawContainer}>
        <HarmonyButton
          variant={HarmonyButtonType.SECONDARY}
          text={messages.withdraw}
          // TODO: update leftIcon and wire up withdraw modal https://linear.app/audius/issue/PAY-1754/usdc-withdrawal-flow-ui
          iconLeft={() => <Icon icon={IconNote} size='medium' />}
          onClick={() => {}}
        />
        <PopupMenu
          transformOrigin={{ horizontal: 'center', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
          items={menuItems}
          renderTrigger={(anchorRef, triggerPopup) => (
            <HarmonyButton
              ref={anchorRef}
              variant={HarmonyButtonType.SECONDARY}
              iconLeft={IconKebabHorizontal}
              onClick={triggerPopup}
            />
          )}
        />
      </div>
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
    this.props.fetchDashboard(0, tablePageSize)
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
    const isUSDCEnabled = getFeatureEnabled(FeatureFlags.USDC_PURCHASES)

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
            {isUSDCEnabled ? <USDCSection account={account} /> : null}
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
