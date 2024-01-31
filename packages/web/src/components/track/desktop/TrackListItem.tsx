import { EnhancedCollectionTrack } from '@audius/common/store'

import { memo, MouseEvent, useRef } from 'react'

import { ID, UID } from '@audius/common/models'
import { Genre, formatSeconds } from '@audius/common/utils'
import cn from 'classnames'

import IconKebabHorizontal from 'assets/img/iconKebabHorizontal.svg'
import { ArtistPopover } from 'components/artist/ArtistPopover'
import Menu from 'components/menu/Menu'
import { OwnProps as TrackMenuProps } from 'components/menu/TrackMenu'
import Skeleton from 'components/skeleton/Skeleton'
import { TablePlayButton } from 'components/table/components/TablePlayButton'
import { isDescendantElementOf } from 'utils/domUtils'
import { profilePage } from 'utils/route'

import { TrackTileSize } from '../types'

import styles from './TrackListItem.module.css'

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
  const menuRef = useRef<HTMLDivElement>(null)

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

  const deleted = track.is_delete || !!track.user?.is_deactivated
  const strings = makeStrings({ deleted })

  const onClickArtistName = (e: MouseEvent) => {
    e.stopPropagation()
    if (goToRoute) goToRoute(profilePage(track.user.handle))
  }

  const onClickTrackName = (e: MouseEvent) => {
    if (!disableActions && !deleted) {
      e.stopPropagation()
      if (goToRoute) goToRoute(track.permalink)
    }
  }

  const onMoreClick = (triggerPopup: () => void) => (e: MouseEvent) => {
    triggerPopup()
  }

  const onPlayTrack = (e?: MouseEvent) => {
    // Skip toggle play if click event happened within track menu container
    // because clicking on it should not affect corresponding track.
    // We have to do this instead of stopping the event propagation
    // because we need it to bubble up to the document to allow
    // the document click listener to close other track/playlist tile menus
    // that are already open.
    const shouldSkipTogglePlay = isDescendantElementOf(
      e?.target,
      menuRef.current
    )
    if (!deleted && togglePlay && !shouldSkipTogglePlay)
      togglePlay(track.uid, track.track_id)
  }

  const hideShow = cn({
    [styles.hide]: isLoading,
    [styles.show]: !isLoading
  })

  const menu: Omit<TrackMenuProps, 'children'> = {
    handle: track.user.handle,
    includeAddToPlaylist: !track.is_stream_gated,
    includeArtistPick: false,
    includeEdit: false,
    includeFavorite: true,
    includeRepost: true,
    includeShare: false,
    includeTrackPage: true,
    isArtistPick: track.user.artist_pick_track_id === track.track_id,
    isDeleted: deleted,
    isFavorited: track.has_current_user_saved,
    isOwner: false,
    isOwnerDeactivated: !!track.user?.is_deactivated,
    isReposted: track.has_current_user_reposted,
    trackId: track.track_id,
    trackTitle: track.title,
    genre: track.genre as Genre,
    trackPermalink: track.permalink,
    type: 'track'
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
            {track.user.is_deactivated ? (
              `${track.user.name} [Deactivated]`
            ) : (
              <ArtistPopover handle={track.user.handle}>
                {track.user.name}
              </ArtistPopover>
            )}
          </div>
        </div>
        <div className={styles.duration}>
          {track.duration && formatSeconds(track.duration)}
        </div>
        <Menu menu={menu}>
          {(ref, triggerPopup) => (
            <div className={cn(styles.menuContainer)} ref={menuRef}>
              {!disableActions && !deleted ? (
                <div ref={ref}>
                  <IconKebabHorizontal
                    className={styles.iconKebabHorizontal}
                    onClick={onMoreClick(triggerPopup)}
                  />
                </div>
              ) : (
                <div className={styles.iconKebabHorizontal} />
              )}
            </div>
          )}
        </Menu>
      </div>
    </div>
  )
}

export default memo(TrackListItem)
