import { useCallback, useContext } from 'react'

import { CreatePlaylistSource, Collection, ID } from '@audius/common/models'
import {
  accountSelectors,
  cacheCollectionsActions,
  addToCollectionUISelectors,
  addToCollectionUIActions,
  modalsActions
} from '@audius/common/store'
import { capitalize } from 'lodash'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { CollectionCard } from 'components/collection'
import CardLineup from 'components/lineup/CardLineup'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import { useTemporaryNavContext } from 'components/nav/mobile/NavContext'
import TextElement, { Type } from 'components/nav/mobile/TextElement'
import { ToastContext } from 'components/toast/ToastContext'
import useHasChangedRoute from 'hooks/useHasChangedRoute'
import NewCollectionButton from 'pages/saved-page/components/mobile/NewCollectionButton'
import { AppState } from 'store/types'
import { withNullGuard } from 'utils/withNullGuard'

import styles from './AddToCollection.module.css'
const { getTrackId, getTrackTitle, getCollectionType } =
  addToCollectionUISelectors
const { close } = addToCollectionUIActions
const { addTrackToPlaylist, createPlaylist, createAlbum } =
  cacheCollectionsActions
const { setVisibility } = modalsActions

const { getAccountWithNameSortedPlaylistsAndAlbums } = accountSelectors

const getMessages = (collectionType: 'album' | 'playlist') => ({
  title: `Add To ${capitalize(collectionType)}`,
  addedToast: `Added To ${capitalize(collectionType)}!`,
  createdToast: `${capitalize(collectionType)} created!`
})

type AddToCollectionProps = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const g = withNullGuard((props: AddToCollectionProps) => {
  const { account, trackTitle } = props
  if (account && trackTitle) {
    return {
      ...props,
      account,
      trackTitle
    }
  }
})

const AddToCollection = g(
  ({
    account,
    trackId,
    trackTitle,
    collectionType,
    close,
    addTrackToPlaylist,
    createAlbum,
    createPlaylist
  }) => {
    // Close the page if the route was changed
    useHasChangedRoute(close)
    const messages = getMessages(collectionType)
    const setters = useCallback(
      () => ({
        left: (
          <TextElement text='Cancel' type={Type.SECONDARY} onClick={close} />
        ),
        center: messages.title,
        right: null
      }),
      [close, messages.title]
    )
    useTemporaryNavContext(setters)

    const { toast } = useContext(ToastContext)

    const cards = (
      collectionType === 'album' ? account.albums : account.playlists
    ).map((playlist) => {
      return (
        <CollectionCard
          key={playlist.playlist_id}
          id={playlist.playlist_id}
          size='xs'
          noNavigation
          onClick={() => {
            toast(messages.addedToast)
            addTrackToPlaylist(trackId!, playlist.playlist_id)
            close()
          }}
        />
      )
    })

    const addToNewPlaylist = useCallback(() => {
      const metadata = { playlist_name: trackTitle }
      if (!trackId) return
      collectionType === 'album'
        ? createAlbum(metadata, trackId)
        : createPlaylist(metadata, trackId!)
      toast(messages.createdToast)
      close()
    }, [
      trackTitle,
      trackId,
      collectionType,
      createAlbum,
      createPlaylist,
      toast,
      messages.createdToast,
      close
    ])

    return (
      <MobilePageContainer>
        <div className={styles.bodyContainer}>
          <NewCollectionButton
            onClick={addToNewPlaylist}
            collectionType={collectionType}
          />
          <div className={styles.cardsContainer}>
            <CardLineup cards={cards} />
          </div>
        </div>
      </MobilePageContainer>
    )
  }
)

function mapStateToProps(state: AppState) {
  return {
    account: getAccountWithNameSortedPlaylistsAndAlbums(state),
    trackId: getTrackId(state),
    trackTitle: getTrackTitle(state),
    collectionType: getCollectionType(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    addTrackToPlaylist: (trackId: ID, playlistId: ID) =>
      dispatch(addTrackToPlaylist(trackId, playlistId)),
    createPlaylist: (metadata: Partial<Collection>, trackId: ID) =>
      dispatch(
        createPlaylist(metadata, CreatePlaylistSource.FROM_TRACK, trackId)
      ),
    createAlbum: (metadata: Partial<Collection>, trackId: ID) =>
      dispatch(createAlbum(metadata, CreatePlaylistSource.FROM_TRACK, trackId)),
    close: () => {
      dispatch(close())
      dispatch(setVisibility({ modal: 'AddToCollection', visible: false }))
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AddToCollection)
