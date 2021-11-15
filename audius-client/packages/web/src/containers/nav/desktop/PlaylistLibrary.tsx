import React, { useCallback, useState } from 'react'

import cn from 'classnames'
import { useDispatch } from 'react-redux'
import { NavLink, NavLinkProps } from 'react-router-dom'

import { Name } from 'common/models/Analytics'
import { SmartCollection } from 'common/models/Collection'
import { ID } from 'common/models/Identifiers'
import { SmartCollectionVariant } from 'common/models/SmartCollectionVariant'
import { AccountCollection } from 'common/store/account/reducer'
import {
  getAccountNavigationPlaylists,
  getAccountUser,
  getPlaylistLibrary
} from 'common/store/account/selectors'
import { addTrackToPlaylist } from 'common/store/cache/collections/actions'
import UpdateDot from 'components/general/UpdateDot'
import Tooltip from 'components/tooltip/Tooltip'
import Draggable from 'containers/dragndrop/Draggable'
import Droppable from 'containers/dragndrop/Droppable'
import { getPlaylistUpdates } from 'containers/notification/store/selectors'
import { useArePlaylistUpdatesEnabled } from 'containers/remote-config/hooks'
import { SMART_COLLECTION_MAP } from 'containers/smart-collection/smartCollections'
import { make, useRecord } from 'store/analytics/actions'
import { getIsDragging } from 'store/dragndrop/selectors'
import { reorderPlaylistLibrary } from 'store/playlist-library/helpers'
import { update } from 'store/playlist-library/slice'
import { useSelector } from 'utils/reducer'
import { playlistPage, getPathname } from 'utils/route'

import navColumnStyles from './NavColumn.module.css'
import styles from './PlaylistLibrary.module.css'

type DraggableNavLinkProps = NavLinkProps & {
  droppableKey: ID | SmartCollectionVariant
  playlistId: ID | SmartCollectionVariant
  name: string
  onReorder: (
    draggingId: ID | SmartCollectionVariant,
    droppingId: ID | SmartCollectionVariant
  ) => void
  link?: string
}

const DraggableNavLink = ({
  droppableKey,
  playlistId,
  name,
  link,
  onReorder,
  children,
  className,
  ...navLinkProps
}: DraggableNavLinkProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const onDrag = useCallback(() => {
    setIsDragging(true)
  }, [setIsDragging])
  const onDrop = useCallback(() => {
    setIsDragging(false)
  }, [setIsDragging])
  return (
    <Droppable
      key={droppableKey}
      className={styles.droppable}
      hoverClassName={styles.droppableHover}
      onDrop={(id: ID | SmartCollectionVariant) => onReorder(id, playlistId)}
      acceptedKinds={['library-playlist']}
    >
      <Draggable
        id={playlistId}
        text={name}
        link={link}
        kind='library-playlist'
        onDrag={onDrag}
        onDrop={onDrop}
      >
        <NavLink
          {...navLinkProps}
          draggable={false}
          className={cn(className, styles.navLink, {
            [styles.dragging]: isDragging
          })}
        >
          {children}
        </NavLink>
      </Draggable>
    </Droppable>
  )
}

type PlaylistLibraryProps = {
  onClickNavLinkWithAccount: () => void
}

const PlaylistLibrary = ({
  onClickNavLinkWithAccount
}: PlaylistLibraryProps) => {
  const account = useSelector(getAccountUser)
  const playlists = useSelector(getAccountNavigationPlaylists)
  const library = useSelector(getPlaylistLibrary)
  const updates = useSelector(getPlaylistUpdates)
  const { dragging, kind: draggingKind } = useSelector(getIsDragging)
  const dispatch = useDispatch()
  const {
    isEnabled: arePlaylistUpdatesEnabled
  } = useArePlaylistUpdatesEnabled()
  const record = useRecord()

  const onReorder = useCallback(
    (
      draggingId: ID | SmartCollectionVariant,
      droppingId: ID | SmartCollectionVariant
    ) => {
      if (!library) return
      const newLibrary = reorderPlaylistLibrary(library, draggingId, droppingId)
      dispatch(update({ playlistLibrary: newLibrary }))
    },
    [dispatch, library]
  )

  const renderExplorePlaylist = (playlist: SmartCollection) => {
    const name = playlist.playlist_name
    const url = playlist.link
    return (
      <DraggableNavLink
        playlistId={name as SmartCollectionVariant}
        droppableKey={name as SmartCollectionVariant}
        name={name}
        to={url}
        onReorder={onReorder}
        isActive={() => url === getPathname()}
        activeClassName='active'
        onClick={onClickNavLinkWithAccount}
        className={cn(navColumnStyles.link, {
          [navColumnStyles.disabledLink]:
            !account || (dragging && draggingKind !== 'library-playlist')
        })}
      >
        {name}
      </DraggableNavLink>
    )
  }

  const onClick = useCallback(
    (playlistId: ID, hasUpdate: boolean) => {
      onClickNavLinkWithAccount()
      record(
        make(Name.PLAYLIST_LIBRARY_CLICKED, {
          playlistId,
          hasUpdate
        })
      )
    },
    [record, onClickNavLinkWithAccount]
  )

  const renderPlaylist = (playlist: AccountCollection) => {
    if (!account || !playlist) return
    const { id, name } = playlist
    const url = playlistPage(playlist.user.handle, name, id)
    const addTrack = (trackId: ID) => dispatch(addTrackToPlaylist(trackId, id))
    const isOwner = playlist.user.handle === account.handle
    const hasUpdate = updates.includes(id)
    return (
      <Droppable
        key={id}
        className={navColumnStyles.droppable}
        hoverClassName={navColumnStyles.droppableHover}
        onDrop={addTrack}
        acceptedKinds={['track']}
        disabled={!isOwner}
      >
        <DraggableNavLink
          droppableKey={id}
          playlistId={id}
          name={name}
          link={url}
          to={url}
          onReorder={onReorder}
          isActive={() => url === getPathname()}
          activeClassName='active'
          className={cn(navColumnStyles.link, {
            [navColumnStyles.playlistUpdate]: hasUpdate,
            [navColumnStyles.droppableLink]:
              isOwner &&
              dragging &&
              (draggingKind === 'track' || draggingKind === 'playlist'),
            [navColumnStyles.disabledLink]:
              dragging &&
              ((draggingKind !== 'track' &&
                draggingKind !== 'playlist' &&
                draggingKind !== 'library-playlist') ||
                !isOwner)
          })}
          onClick={() => onClick(id, hasUpdate)}
        >
          {!!arePlaylistUpdatesEnabled && hasUpdate ? (
            <div className={navColumnStyles.updateDotContainer}>
              <Tooltip
                className={navColumnStyles.updateDotTooltip}
                shouldWrapContent={true}
                shouldDismissOnClick={false}
                mount={null}
                mouseEnterDelay={0.1}
                text='Recently Updated'
              >
                <div>
                  <UpdateDot />
                </div>
              </Tooltip>
              <span>{name}</span>
            </div>
          ) : (
            <span>{name}</span>
          )}
        </DraggableNavLink>
      </Droppable>
    )
  }

  // Iterate over playlist library and render out available explore/smart
  // playlists and ordered playlists. Remaining playlists that are unordered
  // are rendered aftewards by sort order.
  const playlistsNotInLibrary = { ...playlists }
  return (
    <>
      <Droppable
        key={-1}
        className={cn(styles.droppable, styles.top)}
        hoverClassName={styles.droppableHover}
        onDrop={(id: ID | SmartCollectionVariant) => onReorder(id, -1)}
        acceptedKinds={['library-playlist']}
      />
      {account &&
        playlists &&
        library &&
        library.contents.map(identifier => {
          switch (identifier.type) {
            case 'explore_playlist': {
              const playlist = SMART_COLLECTION_MAP[identifier.playlist_id]
              if (!playlist) return null
              return renderExplorePlaylist(playlist)
            }
            case 'playlist': {
              const playlist = playlists[identifier.playlist_id]
              if (playlist) {
                delete playlistsNotInLibrary[identifier.playlist_id]
              }
              return renderPlaylist(playlist)
            }
            case 'temp_playlist': {
              try {
                const playlist = playlists[parseInt(identifier.playlist_id)]
                if (playlist) {
                  delete playlistsNotInLibrary[parseInt(identifier.playlist_id)]
                }
                return renderPlaylist(playlist)
              } catch (e) {
                console.debug(e)
                break
              }
            }
            case 'folder':
              // TODO support folders!
              break
          }
          return null
        })}
      {Object.values(playlistsNotInLibrary).map(playlist => {
        return renderPlaylist(playlist)
      })}
      {playlists && Object.keys(playlists).length === 0 ? (
        <div className={cn(navColumnStyles.link, navColumnStyles.disabled)}>
          Create your first playlist!
        </div>
      ) : null}
    </>
  )
}

export default PlaylistLibrary
