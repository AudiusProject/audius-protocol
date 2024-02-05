import { useState, useCallback, useMemo } from 'react'

import { Status, User, Track, isContentUSDCPurchaseGated } from '@audius/common'
import { SelectablePill } from '@audius/harmony'
import {
  IconHidden,
  IconVisibilityPublic,
  IconCart,
  IconSpecialAccess,
  IconCollectible,
  IconSearch
} from '@audius/stems'
import { useDispatch, useSelector } from 'react-redux'

import IconClose from 'assets/img/iconRemove.svg'
import { Input } from 'components/input'
import { TracksTable, TracksTableColumn } from 'components/tracks-table'

import { getDashboardTracksStatus } from '../store/selectors'
import { fetchTracks } from '../store/slice'

import styles from './TracksTableContainer.module.css'

// Pagination Constants
export const tablePageSize = 50

const messages = {
  filterInputPlacehoder: 'Search Tracks',
  all: 'All',
  public: 'Public',
  premium: 'Premium',
  specialAcess: 'SpecialAccess',
  gated: 'Gated',
  hidden: 'Hidden',
  tracks: 'Tracks'
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
  dataSource: DataSourceTrack[]
  account: User
}

enum Pills {
  ALL,
  PUBLIC,
  PREMIUM,
  SPECIAL_ACCESS,
  COLLECTIBLE_GATED,
  HIDDEN
}

export const TracksTableContainer = ({
  onClickRow,
  dataSource,
  account
}: TracksTableProps) => {
  const [filterText, setFilterText] = useState('')
  const dispatch = useDispatch()
  const tracksStatus = useSelector(getDashboardTracksStatus)
  const [selectedPill, setSelectedPill] = useState(Pills.ALL)

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setFilterText(val)
  }

  let filteredData: DataSourceTrack[]
  const {
    hasOnlyOneSection,
    pub,
    collectibleGated,
    hidden,
    premium,
    specialAccess
  } = useMemo(() => {
    const pub = dataSource.filter(
      (data) =>
        data.is_unlisted === false &&
        !isContentUSDCPurchaseGated(data.stream_conditions)
    )
    const specialAccess = dataSource.filter(
      (data) =>
        'tip_user_id' in (data.stream_conditions || {}) ||
        'follow_user_id' in (data.stream_conditions || {})
    )
    const hidden = dataSource.filter((data) => data.is_unlisted === true)
    const premium = dataSource.filter(
      (data) => 'usdc_purchase' in (data.stream_conditions || {})
    )
    const collectibleGated = dataSource.filter(
      (data) => 'nft_collection' in (data.stream_conditions || {})
    )

    const arrays = [pub, specialAccess, hidden, premium, collectibleGated]
    const nonEmptyArrays = arrays.filter((arr) => arr.length > 0)
    const hasOnlyOneSection = nonEmptyArrays.length === 1

    return {
      hasOnlyOneSection,
      pub,
      specialAccess,
      hidden,
      premium,
      collectibleGated
    }
  }, [dataSource])

  switch (selectedPill) {
    case Pills.ALL:
      // Keep all data
      filteredData = dataSource
      break
    case Pills.PUBLIC:
      filteredData = pub
      break
    case Pills.COLLECTIBLE_GATED:
      filteredData = collectibleGated
      break
    case Pills.HIDDEN:
      filteredData = hidden
      break
    case Pills.PREMIUM:
      filteredData = premium
      break
    case Pills.SPECIAL_ACCESS:
      filteredData = specialAccess
      break
  }

  if (filterText) {
    filteredData = filteredData.filter((data) =>
      data.title.toLowerCase().includes(filterText.toLowerCase())
    )
  }

  const handleFetchPage = useCallback(
    (page: number) => {
      dispatch(
        fetchTracks({ offset: page * tablePageSize, limit: tablePageSize })
      )
    },
    [dispatch]
  )

  return (
    <div className={styles.tableContainer}>
      <div className={styles.header}>
        <div className={styles.pills}>
          {!hasOnlyOneSection ? (
            <SelectablePill
              isSelected={selectedPill === Pills.ALL}
              label={messages.all}
              size='large'
              onClick={() => setSelectedPill(Pills.ALL)}
            />
          ) : null}
          {pub.length > 0 ? (
            <SelectablePill
              isSelected={selectedPill === Pills.PUBLIC}
              label={
                messages.public +
                (hasOnlyOneSection ? ` ${messages.tracks}` : '')
              }
              icon={IconVisibilityPublic}
              size='large'
              onClick={() => setSelectedPill(Pills.PUBLIC)}
            />
          ) : null}
          {premium.length > 0 ? (
            <SelectablePill
              isSelected={selectedPill === Pills.PREMIUM}
              label={
                messages.premium +
                (hasOnlyOneSection ? ` ${messages.tracks}` : '')
              }
              icon={IconCart}
              size='large'
              onClick={() => setSelectedPill(Pills.PREMIUM)}
            />
          ) : null}
          {specialAccess.length > 0 ? (
            <SelectablePill
              isSelected={selectedPill === Pills.SPECIAL_ACCESS}
              label={
                messages.specialAcess +
                (hasOnlyOneSection ? ` ${messages.tracks}` : '')
              }
              icon={IconSpecialAccess}
              size='large'
              onClick={() => setSelectedPill(Pills.SPECIAL_ACCESS)}
            />
          ) : null}
          {collectibleGated.length > 0 ? (
            <SelectablePill
              isSelected={selectedPill === Pills.COLLECTIBLE_GATED}
              label={
                messages.gated +
                (hasOnlyOneSection ? ` ${messages.tracks}` : '')
              }
              icon={IconCollectible}
              size='large'
              onClick={() => setSelectedPill(Pills.COLLECTIBLE_GATED)}
            />
          ) : null}
          {hidden.length > 0 ? (
            <SelectablePill
              isSelected={selectedPill === Pills.HIDDEN}
              label={
                messages.hidden +
                (hasOnlyOneSection ? ` ${messages.tracks}` : '')
              }
              icon={IconHidden}
              size='large'
              onClick={() => setSelectedPill(Pills.HIDDEN)}
            />
          ) : null}
        </div>
        <div className={styles.filterInputContainer}>
          <Input
            className={styles.filterInput}
            placeholder={messages.filterInputPlacehoder}
            prefix={<IconSearch />}
            suffix={
              filterText ? (
                <IconClose
                  className={styles.close}
                  onClick={() => setFilterText('')}
                />
              ) : null
            }
            size='default'
            onChange={handleFilterChange}
            value={filterText}
            variant='bordered'
          />
        </div>
      </div>
      <TracksTable
        data={filteredData}
        disabledTrackEdit
        columns={tableColumns}
        onClickRow={onClickRow}
        loading={tracksStatus === Status.LOADING}
        fetchPage={handleFetchPage}
        pageSize={tablePageSize}
        userId={account.user_id}
        showMoreLimit={5}
        totalRowCount={account.track_count}
        isPaginated
      />
    </div>
  )
}
