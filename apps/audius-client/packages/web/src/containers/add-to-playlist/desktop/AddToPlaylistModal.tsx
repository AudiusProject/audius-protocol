import React, { useContext, useMemo, useState } from 'react'

import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'
import { Modal } from '@audius/stems'
import SimpleBar from 'simplebar-react'

import { ReactComponent as IconMultiselectAdd } from 'assets/img/iconMultiselectAdd.svg'
import SearchBar from 'components/search-bar/SearchBar'
import { ToastContext } from 'components/toast/ToastContext'
import { getAccountWithOwnPlaylists } from 'store/account/selectors'
import {
  addTrackToPlaylist,
  createPlaylist
} from 'store/cache/collections/actions'
import { useCollectionCoverArt } from 'hooks/useImageSize'
import { AppState } from 'store/types'

import { getIsOpen, getTrackId, getTrackTitle } from '../store/selectors'
import { close } from '../store/actions'
import styles from './AddToPlaylistModal.module.css'
import { newCollectionMetadata } from 'schemas'
import { playlistPage } from 'utils/route'
import { CreatePlaylistSource } from 'services/analytics'
import { SquareSizes } from 'models/common/ImageSizes'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import Collection from 'models/Collection'
import { getCollectionId } from 'containers/collection-page/store/selectors'
import ToastLinkContent from 'components/toast/mobile/ToastLinkContent'

const messages = {
  title: 'Add to Playlist',
  newPlaylist: 'New Playlist',
  searchPlaceholder: 'Find one of your playlists',
  addedToast: 'Added To Playlist!',
  createdToast: 'Playlist Created!',
  view: 'View'
}

const AddToPlaylistModal = () => {
  const dispatch = useDispatch()
  const { toast } = useContext(ToastContext)

  const isOpen = useSelector(getIsOpen)
  const trackId = useSelector(getTrackId)
  const trackTitle = useSelector(getTrackTitle)
  const currentCollectionId = useSelector(getCollectionId)
  const account = useSelector((state: AppState) =>
    getAccountWithOwnPlaylists(state, {})
  )

  const [searchValue, setSearchValue] = useState('')

  const filteredPlaylists = useMemo(() => {
    return (account?.playlists ?? []).filter(
      (playlist: Collection) =>
        // Don't allow adding to this playlist if already on this playlist's page.
        playlist.playlist_id !== currentCollectionId &&
        (searchValue
          ? playlist.playlist_name
              .toLowerCase()
              .includes(searchValue.toLowerCase())
          : true)
    )
  }, [searchValue, account, currentCollectionId])

  const handlePlaylistClick = (playlist: Collection) => {
    dispatch(addTrackToPlaylist(trackId, playlist.playlist_id))
    if (account && trackTitle) {
      toast(
        <ToastLinkContent
          text={messages.addedToast}
          linkText={messages.view}
          link={playlistPage(account.handle, trackTitle, playlist.playlist_id)}
        />
      )
    }
    dispatch(close())
  }

  const handleCreatePlaylist = () => {
    const metadata = newCollectionMetadata({
      playlist_name: trackTitle,
      is_private: false
    })
    const tempId = `${Date.now()}`
    dispatch(
      createPlaylist(tempId, metadata, CreatePlaylistSource.FROM_TRACK, trackId)
    )
    dispatch(addTrackToPlaylist(trackId, tempId))
    if (account && trackTitle) {
      toast(
        <ToastLinkContent
          text={messages.createdToast}
          linkText={messages.view}
          link={playlistPage(account.handle, trackTitle, tempId)}
        />
      )
    }
    dispatch(close())
  }

  return (
    <Modal
      isOpen={isOpen}
      showTitleHeader
      showDismissButton
      title={messages.title}
      onClose={() => dispatch(close())}
      allowScroll={false}
      bodyClassName={styles.modalBody}
      headerContainerClassName={styles.modalHeader}
    >
      <SearchBar
        className={styles.searchBar}
        iconClassname={styles.searchIcon}
        open
        value={searchValue}
        onSearch={setSearchValue}
        onOpen={() => {}}
        onClose={() => {}}
        placeholder={messages.searchPlaceholder}
        shouldAutoFocus={false}
      />
      <SimpleBar className={styles.simpleBar}>
        <div className={styles.listContent}>
          <div className={cn(styles.listItem)} onClick={handleCreatePlaylist}>
            <IconMultiselectAdd className={styles.add} />
            <span>{messages.newPlaylist}</span>
          </div>
          <div className={styles.list}>
            {filteredPlaylists.map(playlist => (
              <div key={`${playlist.playlist_id}`}>
                <PlaylistItem
                  playlist={playlist}
                  handleClick={handlePlaylistClick}
                />
              </div>
            ))}
          </div>
        </div>
      </SimpleBar>
    </Modal>
  )
}

type PlaylistItemProps = {
  handleClick: (playlist: Collection) => void
  playlist: Collection
}

const PlaylistItem = ({ handleClick, playlist }: PlaylistItemProps) => {
  const image = useCollectionCoverArt(
    playlist.playlist_id,
    playlist._cover_art_sizes,
    SquareSizes.SIZE_150_BY_150
  )

  return (
    <div className={cn(styles.listItem)} onClick={() => handleClick(playlist)}>
      <DynamicImage
        className={styles.image}
        wrapperClassName={styles.imageWrapper}
        image={image}
      />
      <span className={styles.playlistName}>{playlist.playlist_name}</span>
    </div>
  )
}

export default AddToPlaylistModal
