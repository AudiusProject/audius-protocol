import { useMemo, useState } from 'react'

import {
  CreatePlaylistSource,
  SquareSizes,
  Collection
} from '@audius/common/models'
import {
  accountSelectors,
  cacheCollectionsActions,
  addToCollectionUISelectors,
  duplicateAddConfirmationModalUIActions,
  toastActions
} from '@audius/common/store'
import { route } from '@audius/common/utils'
import { Modal, Scrollbar, IconMultiselectAdd } from '@audius/harmony'
import cn from 'classnames'
import { capitalize } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import SearchBar from 'components/search-bar/SearchBar'
import { Tooltip } from 'components/tooltip'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'

import styles from './AddToCollectionModal.module.css'
const { getCollectionType, getTrackId, getTrackTitle } =
  addToCollectionUISelectors
const { addTrackToPlaylist, createAlbum, createPlaylist } =
  cacheCollectionsActions
const { getAccountWithNameSortedPlaylistsAndAlbums } = accountSelectors
const { requestOpen: openDuplicateAddConfirmation } =
  duplicateAddConfirmationModalUIActions
const { toast } = toastActions
const { collectionPage } = route

const getMessages = (collectionType: 'album' | 'playlist') => ({
  title: `Add to ${capitalize(collectionType)}`,
  newCollection: `New ${capitalize(collectionType)}`,
  searchPlaceholder: `Find one of your ${collectionType}s`,
  addedToast: `Added To ${capitalize(collectionType)}!`,
  createdToast: `${capitalize(collectionType)} Created!`,
  view: `View`,
  hiddenAdd: `You cannot add hidden tracks to a public ${collectionType}.`
})

const AddToCollectionModal = () => {
  const dispatch = useDispatch()

  const [isOpen, setIsOpen] = useModalState('AddToCollection')
  const collectionType = useSelector(getCollectionType)
  const trackId = useSelector(getTrackId)
  const trackTitle = useSelector(getTrackTitle)
  const isAlbumType = collectionType === 'album'
  const account = useSelector(getAccountWithNameSortedPlaylistsAndAlbums)
  const [searchValue, setSearchValue] = useState('')

  const messages = getMessages(collectionType)

  const filteredCollections = useMemo(() => {
    return ((isAlbumType ? account?.albums : account?.playlists) ?? []).filter(
      (collection: Collection) =>
        collection.playlist_owner_id === account?.user_id &&
        (searchValue
          ? collection.playlist_name
              .toLowerCase()
              .includes(searchValue.toLowerCase())
          : true)
    )
  }, [
    isAlbumType,
    account?.albums,
    account?.playlists,
    account?.user_id,
    searchValue
  ])

  const collectionTrackIdMap = filteredCollections.reduce<
    Record<number, number[]>
  >((acc, collection) => {
    const trackIds = collection.playlist_contents.track_ids.map((t) => t.track)
    acc[collection.playlist_id] = trackIds
    return acc
  }, {})

  const handleCollectionClick = (playlist: Collection) => {
    if (!trackId) return

    const doesCollectionContainTrack =
      collectionTrackIdMap[playlist.playlist_id]?.includes(trackId)

    if (doesCollectionContainTrack) {
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

  const handleCreateCollection = () => {
    if (!trackTitle) return
    const metadata = { playlist_name: trackTitle }
    dispatch(
      (isAlbumType ? createAlbum : createPlaylist)(
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
          <div className={cn(styles.listItem)} onClick={handleCreateCollection}>
            <IconMultiselectAdd className={styles.add} size='xl' />
            <span>{messages.newCollection}</span>
          </div>
          <div className={styles.list}>
            {filteredCollections.map((collection) => (
              <div key={`${collection.playlist_id}`}>
                <CollectionItem
                  collectionType={collectionType}
                  collection={collection}
                  handleClick={handleCollectionClick}
                />
              </div>
            ))}
          </div>
        </div>
      </Scrollbar>
    </Modal>
  )
}

type CollectionItemProps = {
  collectionType: 'album' | 'playlist'
  handleClick: (playlist: Collection) => void
  collection: Collection
  disabled?: boolean
}

const CollectionItem = ({
  disabled = false,
  handleClick,
  collection,
  collectionType
}: CollectionItemProps) => {
  const image = useCollectionCoverArt({
    collectionId: collection.playlist_id,
    size: SquareSizes.SIZE_150_BY_150
  })

  const messages = getMessages(collectionType)
  return (
    <div
      className={cn(styles.listItem, [{ [styles.disabled]: disabled }])}
      onClick={() => handleClick(collection)}
    >
      <DynamicImage
        className={styles.image}
        wrapperClassName={styles.imageWrapper}
        image={image}
      />
      {disabled ? (
        <Tooltip text={messages.hiddenAdd} placement='right'>
          <span className={styles.playlistName}>
            {collection.playlist_name}
          </span>
        </Tooltip>
      ) : (
        <span className={styles.playlistName}>{collection.playlist_name}</span>
      )}
    </div>
  )
}

export default AddToCollectionModal
