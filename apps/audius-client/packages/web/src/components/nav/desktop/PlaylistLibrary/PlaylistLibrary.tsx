import { MutableRefObject, useCallback } from 'react'

import {
  CreatePlaylistSource,
  FavoriteSource,
  Name,
  accountSelectors,
  collectionsSocialActions,
  createPlaylistModalUIActions
} from '@audius/common'
import cn from 'classnames'
import { isEmpty } from 'lodash'
import { useDispatch } from 'react-redux'

import { make, useRecord } from 'common/store/analytics/actions'
import * as signOnActions from 'common/store/pages/signon/actions'
import { Droppable } from 'components/dragndrop'
import Pill from 'components/pill/Pill'
import { Tooltip } from 'components/tooltip'
import { DragDropKind, selectDraggingKind } from 'store/dragndrop/slice'
import { useSelector } from 'utils/reducer'

import { GroupHeader } from '../GroupHeader'

import { EmptyLibraryNavLink } from './EmptyLibraryNavLink'
import styles from './PlaylistLibrary.module.css'
import { PlaylistLibraryNavItem, keyExtractor } from './PlaylistLibraryNavItem'
import { useAddAudioNftPlaylistToLibrary } from './useAddAudioNftPlaylistToLibrary'

const { getPlaylistLibrary, getHasAccount } = accountSelectors
const { saveCollection } = collectionsSocialActions

const messages = {
  header: 'Playlists',
  newPlaylist: 'New',
  newPlaylistOrFolderTooltip: 'New Playlist or Folder'
}

const acceptedKinds: DragDropKind[] = ['playlist']

type PlaylistLibraryProps = {
  scrollbarRef: MutableRefObject<HTMLElement | null>
}

export const PlaylistLibrary = (props: PlaylistLibraryProps) => {
  const { scrollbarRef } = props
  const library = useSelector(getPlaylistLibrary)
  const dispatch = useDispatch()
  const draggingKind = useSelector(selectDraggingKind)
  const isSignedIn = useSelector(getHasAccount)
  const record = useRecord()

  useAddAudioNftPlaylistToLibrary()

  const handleDrop = useCallback(
    (collectionId: number) => {
      dispatch(saveCollection(collectionId, FavoriteSource.NAVIGATOR))
    },
    [dispatch]
  )

  const handleCreatePlaylist = useCallback(() => {
    if (isSignedIn) {
      dispatch(createPlaylistModalUIActions.open())
      record(
        make(Name.PLAYLIST_OPEN_CREATE, { source: CreatePlaylistSource.NAV })
      )
    } else {
      dispatch(signOnActions.openSignOn(/** signIn */ false))
      dispatch(signOnActions.showRequiresAccountModal())
    }
  }, [isSignedIn, dispatch, record])

  const getTooltipPopupContainer = useCallback(
    () => scrollbarRef.current?.parentNode,
    [scrollbarRef]
  )

  if (!library || isEmpty(library?.contents)) {
    return <EmptyLibraryNavLink />
  }

  return (
    <Droppable
      className={styles.droppable}
      hoverClassName={styles.droppableHover}
      onDrop={handleDrop}
      acceptedKinds={acceptedKinds}
    >
      <GroupHeader
        className={cn({
          [styles.droppableLink]: draggingKind === 'playlist'
        })}
      >
        {messages.header}
        <Tooltip
          text={messages.newPlaylistOrFolderTooltip}
          getPopupContainer={getTooltipPopupContainer}
        >
          <Pill
            className={styles.newPlaylist}
            text={messages.newPlaylist}
            icon='save'
            onClick={handleCreatePlaylist}
          />
        </Tooltip>
      </GroupHeader>
      {library.contents.map((content) => (
        <PlaylistLibraryNavItem
          key={keyExtractor(content)}
          item={content}
          level={0}
        />
      ))}
    </Droppable>
  )
}
