import { useMemo, useState } from 'react'

import {
  CreatePlaylistSource,
  Collection,
  SquareSizes,
  accountSelectors,
  cacheCollectionsActions,
  collectionPageSelectors,
  addToPlaylistUISelectors,
  duplicateAddConfirmationModalUIActions,
  toastActions
} from '@audius/common'
import { Modal, Scrollbar } from '@audius/stems'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import { ReactComponent as IconMultiselectAdd } from 'assets/img/iconMultiselectAdd.svg'
import { useModalState } from 'common/hooks/useModalState'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import SearchBar from 'components/search-bar/SearchBar'
import { Tooltip } from 'components/tooltip'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'
import { AppState } from 'store/types'
import { collectionPage } from 'utils/route'

import styles from './AddToPlaylistModal.module.css'
const { getTrackId, getTrackTitle, getTrackIsUnlisted } =
  addToPlaylistUISelectors
const { getCollectionId } = collectionPageSelectors
const { addTrackToPlaylist, createPlaylist } = cacheCollectionsActions
const getAccountWithOwnPlaylists = accountSelectors.getAccountWithOwnPlaylists
const { requestOpen: openDuplicateAddConfirmation } =
  duplicateAddConfirmationModalUIActions
const { toast } = toastActions

const messages = {
  title: 'Add to Playlist',
  newPlaylist: 'New Playlist',
  searchPlaceholder: 'Find one of your playlists',
  addedToast: 'Added To Playlist!',
  createdToast: 'Playlist Created!',
  view: 'View',
  hiddenAdd: 'You cannot add hidden tracks to a public playlist.'
}

const AddToPlaylistModal = () => {
  const dispatch = useDispatch()

  const [isOpen, setIsOpen] = useModalState('AddToPlaylist')
  const trackId = useSelector(getTrackId)
  const trackTitle = useSelector(getTrackTitle)
  const isTrackUnlisted = useSelector(getTrackIsUnlisted)
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

  const playlistTrackIdMap = filteredPlaylists.reduce<Record<number, number[]>>(
    (acc, playlist) => {
      const trackIds = playlist.playlist_contents.track_ids.map((t) => t.track)
      acc[playlist.playlist_id] = trackIds
      return acc
    },
    {}
  )

  const handlePlaylistClick = (playlist: Collection) => {
    if (!trackId) return

    const doesPlaylistContainTrack =
      playlistTrackIdMap[playlist.playlist_id]?.includes(trackId)

    if (doesPlaylistContainTrack) {
      dispatch(
        openDuplicateAddConfirmation({
          playlistId: playlist.playlist_id,
          trackId
        })
      )
    } else {
      dispatch(addTrackToPlaylist(trackId, playlist.playlist_id))
      if (account && trackTitle) {
        toast({
          content: messages.addedToast,
          link: collectionPage(
            account.handle,
            trackTitle,
            playlist.playlist_id,
            playlist.permalink,
            playlist.is_album
          ),
          linkText: messages.view
        })
      }
    }

    setIsOpen(false)
  }

  const handleDisabledPlaylistClick = () => {
    toast({ content: messages.hiddenAdd })
  }

  const handleCreatePlaylist = () => {
    if (!trackTitle) return
    const metadata = { playlist_name: trackTitle }
    dispatch(
      createPlaylist(
        metadata,
        CreatePlaylistSource.FROM_TRACK,
        trackId,
        'toast'
      )
    )
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
                  disabled={isTrackUnlisted && !playlist.is_private}
                  playlist={playlist}
                  handleClick={
                    isTrackUnlisted && !playlist.is_private
                      ? handleDisabledPlaylistClick
                      : handlePlaylistClick
                  }
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
  disabled?: boolean
}

const PlaylistItem = ({
  disabled = false,
  handleClick,
  playlist
}: PlaylistItemProps) => {
  const image = useCollectionCoverArt(
    playlist.playlist_id,
    playlist._cover_art_sizes,
    SquareSizes.SIZE_150_BY_150
  )

  return (
    <div
      className={cn(styles.listItem, [{ [styles.disabled]: disabled }])}
      onClick={() => handleClick(playlist)}
    >
      <DynamicImage
        className={styles.image}
        wrapperClassName={styles.imageWrapper}
        image={image}
      />
      {disabled ? (
        <Tooltip text={messages.hiddenAdd} placement='right'>
          <span className={styles.playlistName}>{playlist.playlist_name}</span>
        </Tooltip>
      ) : (
        <span className={styles.playlistName}>{playlist.playlist_name}</span>
      )}
    </div>
  )
}

export default AddToPlaylistModal
