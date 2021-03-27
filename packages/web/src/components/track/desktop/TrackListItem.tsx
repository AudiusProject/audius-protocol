import React, { memo, MouseEvent } from 'react'
import cn from 'classnames'

import Skeleton from 'components/general/Skeleton'
import TablePlayButton from 'components/tracks-table/TablePlayButton'
import ArtistPopover from 'components/artist/ArtistPopover'
import Menu from 'containers/menu/Menu'
import styles from './TrackListItem.module.css'
import { formatSeconds } from 'utils/timeUtil'
import { ReactComponent as IconKebabHorizontal } from 'assets/img/iconKebabHorizontal.svg'
import { trackPage, profilePage } from 'utils/route'
import { TrackTileSize } from '../types'
import { OwnProps as TrackMenuProps } from 'containers/menu/TrackMenu'
import { UID, ID } from 'models/common/Identifiers'
import { EnhancedCollectionTrack } from 'store/cache/collections/selectors'

const makeStrings = ({ deleted }: { deleted: boolean }) => ({
  deleted: deleted ? ` [Deleted By Artist]` : '',
  by: 'by'
})

type TrackListItemProps = {
  index: number
  isLoading: boolean
  active: boolean
  size: TrackTileSize
  disableActions: boolean
  playing: boolean
  togglePlay: (uid: UID, id: ID) => void
  goToRoute: (route: string) => void
  artistHandle: string
  track?: EnhancedCollectionTrack
  forceSkeleton?: boolean
}

const TrackListItem = ({
  track,
  active,
  disableActions,
  playing,
  index,
  size,
  goToRoute,
  togglePlay,
  isLoading,
  forceSkeleton = false
}: TrackListItemProps) => {
  if (forceSkeleton) {
    return (
      <div
        className={cn(styles.playlistTrack, {
          [styles.large]: size === TrackTileSize.LARGE,
          [styles.small]: size === TrackTileSize.SMALL
        })}
      >
        <Skeleton className={styles.skeleton} width='96%' height='80%' />
      </div>
    )
  }

  if (!track) return null

  const { is_delete: deleted } = track
  const strings = makeStrings({ deleted })

  const onClickArtistName = (e: MouseEvent) => {
    e.stopPropagation()
    if (goToRoute) goToRoute(profilePage(track.user.handle))
  }

  const onClickTrackName = (e: MouseEvent) => {
    if (!disableActions && !deleted) {
      e.stopPropagation()
      if (goToRoute)
        goToRoute(trackPage(track.user.handle, track.title, track.track_id))
    }
  }

  const onMoreClick = (e: MouseEvent) => e.stopPropagation()

  const onPlayTrack = () => {
    if (!deleted && togglePlay) togglePlay(track.uid, track.track_id)
  }

  const hideShow = cn({
    [styles.hide]: isLoading,
    [styles.show]: !isLoading
  })

  const menu: TrackMenuProps = {
    handle: track.user.handle,
    trackId: track.track_id,
    trackTitle: track.title,
    type: 'track',
    isOwner: false,
    isDeleted: deleted,
    includeEdit: false,
    includeFavorite: true,
    includeShare: true,
    includeRepost: true,
    includeArtistPick: false,
    includeTrackPage: true,
    includeAddToPlaylist: true,
    isArtistPick: track.user._artist_pick === track.track_id,
    isReposted: track.has_current_user_reposted,
    isFavorited: track.has_current_user_saved,
    mount: 'page'
  }

  return (
    <div
      className={cn(styles.playlistTrack, {
        [styles.large]: size === TrackTileSize.LARGE,
        [styles.small]: size === TrackTileSize.SMALL,
        [styles.deleted]: deleted,
        [styles.active]: active,
        [styles.disabled]: disableActions || deleted,
        [styles.noBorder]: isLoading
      })}
      onClick={onPlayTrack}
    >
      {isLoading && (
        <Skeleton className={styles.skeleton} width='96%' height='80%' />
      )}
      <div className={cn(styles.wrapper, hideShow)}>
        {deleted && size !== TrackTileSize.SMALL ? (
          <div className={styles.listButton} style={{ height: 24 }} />
        ) : null}
        {!disableActions && size !== TrackTileSize.SMALL && !deleted ? (
          <div className={styles.listButton}>
            <TablePlayButton
              playing={active}
              paused={!playing}
              hideDefault={false}
            />
          </div>
        ) : null}
        <div className={styles.trackNumber}>{index + 1}</div>
        <div className={styles.nameArtistContainer}>
          <div className={styles.trackTitle} onClick={onClickTrackName}>
            {track.title}
            {strings.deleted}
          </div>
          <div className={styles.artistName} onClick={onClickArtistName}>
            <div className={styles.by}>{strings.by}</div>
            <ArtistPopover handle={track.user.handle}>
              {track.user.name}
            </ArtistPopover>
          </div>
        </div>
        <div className={styles.duration}>
          {track.duration && formatSeconds(track.duration)}
        </div>
        {deleted ? <div className={styles.more} style={{ width: 16 }} /> : null}
        {!disableActions && !deleted ? (
          <div className={styles.more} onClick={onMoreClick}>
            <Menu menu={menu}>
              <IconKebabHorizontal className={styles.iconKebabHorizontal} />
            </Menu>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default memo(TrackListItem)
