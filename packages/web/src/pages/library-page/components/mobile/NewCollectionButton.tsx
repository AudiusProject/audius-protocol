import { useCallback } from 'react'

import { Name, CreatePlaylistSource } from '@audius/common/models'
import { cacheCollectionsActions } from '@audius/common/store'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { useRecord, make } from 'common/store/analytics/actions'

import styles from './NewCollectionButton.module.css'

const { createPlaylist, createAlbum } = cacheCollectionsActions

const messages = {
  createPlaylist: 'Create a New Playlist',
  createAlbum: 'Create a New Album'
}

type OwnProps = {
  collectionType: 'playlist' | 'album'
  onClick?: () => void
}

type NewCollectionButtonProps = OwnProps & ReturnType<typeof mapDispatchToProps>

const NewCollectionButton = ({
  createNewPlaylist,
  createNewAlbum,
  onClick,
  collectionType
}: NewCollectionButtonProps) => {
  const record = useRecord()

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick()
    } else {
      if (collectionType === 'album') {
        createNewAlbum()
      } else {
        createNewPlaylist()
      }
    }
    record(
      make(Name.PLAYLIST_OPEN_CREATE, {
        source: CreatePlaylistSource.LIBRARY_PAGE
      })
    )
  }, [collectionType, createNewAlbum, createNewPlaylist, onClick, record])

  return (
    <button className={styles.button} onClick={handleClick}>
      {collectionType === 'album'
        ? messages.createAlbum
        : messages.createPlaylist}
    </button>
  )
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    createNewPlaylist: () =>
      dispatch(
        createPlaylist(
          { playlist_name: 'New Playlist' },
          CreatePlaylistSource.LIBRARY_PAGE
        )
      ),

    createNewAlbum: () =>
      dispatch(
        createAlbum(
          { playlist_name: 'New Album' },
          CreatePlaylistSource.LIBRARY_PAGE
        )
      )
  }
}

export default connect(undefined, mapDispatchToProps)(NewCollectionButton)
