import { useState, useMemo, useCallback } from 'react'

import { Status, User, Track } from '@audius/common'
import { IconFilter, IconNote, IconHidden } from '@audius/stems'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import { Input } from 'components/input'
import { TracksTable, TracksTableColumn } from 'components/tracks-table'
import useTabs, { useTabRecalculator } from 'hooks/useTabs/useTabs'

import { fetchDashboardTracks } from '../store/actions'
import { getDashboardTracksStatus } from '../store/selectors'

import styles from './TracksTableContainer.module.css'

// Pagination Constants
export const tablePageSize = 50

const messages = {
  publicTracksTabTitle: 'PUBLIC TRACKS',
  unlistedTracksTabTitle: 'HIDDEN TRACKS',
  filterInputPlacehoder: 'Filter Tracks'
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

export type DataSourceTrack = Track & {
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

export const TracksTableContainer = ({
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
