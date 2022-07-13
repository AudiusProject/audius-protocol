import { useContext, useMemo, useState } from 'react'

import { Modal, Scrollbar } from '@audius/stems'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import { ReactComponent as IconMultiselectAdd } from 'assets/img/iconMultiselectAdd.svg'
import { useModalState } from 'common/hooks/useModalState'
import { CreatePlaylistSource } from 'common/models/Analytics'
import { Collection } from 'common/models/Collection'
import { SquareSizes } from 'common/models/ImageSizes'
import { getAccountWithOwnPlaylists } from 'common/store/account/selectors'
import {
  addTrackToPlaylist,
  createPlaylist
} from 'common/store/cache/collections/actions'
import { getCollectionId } from 'common/store/pages/collection/selectors'
import {
  getTrackId,
  getTrackTitle
} from 'common/store/ui/add-to-playlist/selectors'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import SearchBar from 'components/search-bar/SearchBar'
import { ToastContext } from 'components/toast/ToastContext'
import ToastLinkContent from 'components/toast/mobile/ToastLinkContent'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'
import { newCollectionMetadata } from 'schemas'
import { AppState } from 'store/types'
import { playlistPage } from 'utils/route'

import styles from './AddToPlaylistModal.module.css'

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

  const [isOpen, setIsOpen] = useModalState('AddToPlaylist')
  const trackId = useSelector(getTrackId)
  const trackTitle = useSelector(getTrackTitle)
  const currentCollectionId = useSelector(getCollectionId)
  const account = useSelector((state: AppState) =>
    getAccountWithOwnPlaylists(state)
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
    setIsOpen(false)
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
    setIsOpen(false)
  }

  return (
    <Modal
      isOpen={isOpen === true}
      showTitleHeader
      showDismissButton
      title={messages.title}
      onClose={() => setIsOpen(false)}
      allowScroll={false}
      bodyClassName={styles.modalBody}
      headerContainerClassName={styles.modalHeader}>
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
      <Scrollbar>
        <div className={styles.listContent}>
          <div className={cn(styles.listItem)} onClick={handleCreatePlaylist}>
            <IconMultiselectAdd className={styles.add} />
            <span>{messages.newPlaylist}</span>
          </div>
          <div className={styles.list}>
            {filteredPlaylists.map((playlist) => (
              <div key={`${playlist.playlist_id}`}>
                <PlaylistItem
                  playlist={playlist}
                  handleClick={handlePlaylistClick}
                />
              </div>
            ))}
          </div>
        </div>
      </Scrollbar>
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
