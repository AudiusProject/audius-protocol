import { ChangeEvent, memo, useMemo } from 'react'

import { ID } from '@audius/common'
import { IconPause, IconPlay } from '@audius/harmony'
import { Button, ButtonType } from '@audius/stems'

import FilterInput from 'components/filter-input/FilterInput'
import Header from 'components/header/desktop/Header'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import Page from 'components/page/Page'
import { dateSorter } from 'components/table'
import { TracksTable } from 'components/tracks-table'
import EmptyTable from 'components/tracks-table/EmptyTable'

import styles from './HistoryPage.module.css'

export type HistoryPageProps = {
  title: string
  description: string
  userId: ID
  entries: any
  dataSource: any
  playingIndex: number
  isEmpty: boolean
  loading: boolean
  queuedAndPlaying: boolean
  onClickRow: (record: any) => void
  onClickSave: (record: any) => void
  onClickTrackName: (record: any) => void
  onClickArtistName: (record: any) => void
  onClickRepost: (record: any) => void
  onSortTracks: (sorters: any) => void
  goToRoute: (route: string) => void
  onPlay: () => void
  onFilterChange: (e: ChangeEvent<HTMLInputElement>) => void
  filterText: string
}

const HistoryPage = ({
  title,
  description,
  userId,
  entries,
  dataSource,
  playingIndex,
  isEmpty,
  loading,
  queuedAndPlaying,
  onClickRow,
  onClickSave,
  onClickTrackName,
  onClickArtistName,
  onClickRepost,
  onSortTracks,
  goToRoute,
  onPlay,
  onFilterChange,
  filterText
}: HistoryPageProps) => {
  const tableLoading = !dataSource.every((track: any) => track.play_count > -1)

  const playAllButton = !loading ? (
    <Button
      className={styles.playAllButton}
      textClassName={styles.playAllButtonText}
      iconClassName={styles.playAllButtonIcon}
      type={ButtonType.PRIMARY_ALT}
      text={queuedAndPlaying ? 'PAUSE' : 'PLAY'}
      leftIcon={queuedAndPlaying ? <IconPause /> : <IconPlay />}
      onClick={onPlay}
    />
  ) : null

  const trackTableActions = loading
    ? {}
    : {
        onClickFavorite: onClickSave,
        onClickRow,
        onClickTrackName,
        onClickArtistName,
        onClickRepost,
        onSortTracks
      }

  const filter = (
    <FilterInput
      placeholder='Filter Tracks'
      onChange={onFilterChange}
      value={filterText}
    />
  )

  const header = (
    <Header
      primary='History'
      secondary={isEmpty ? null : playAllButton}
      containerStyles={styles.historyPageHeader}
      rightDecorator={!isEmpty && filter}
    />
  )

  const defaultSorter = useMemo(() => dateSorter('dateListened'), [])

  return (
    <Page
      title={title}
      description={description}
      contentClassName={styles.historyPageWrapper}
      header={header}
    >
      <div className={styles.bodyWrapper}>
        {loading ? (
          <LoadingSpinner className={styles.spinner} />
        ) : isEmpty && !loading && !tableLoading ? (
          <EmptyTable
            primaryText='You haven’t listened to any tracks yet.'
            secondaryText='Once you have, this is where you’ll find them!'
            buttonLabel='Start Listening'
            onClick={() => goToRoute('/trending')}
          />
        ) : (
          <TracksTable
            key='history'
            data={dataSource}
            userId={userId}
            loading={tableLoading}
            playing={queuedAndPlaying}
            playingIndex={playingIndex}
            defaultSorter={defaultSorter}
            {...trackTableActions}
          />
        )}
      </div>
    </Page>
  )
}

export default memo(HistoryPage)
