import { useCallback, useContext } from 'react'

import {
  ID,
  CreatePlaylistSource,
  Collection,
  accountSelectors,
  cacheCollectionsActions,
  addToCollectionUIActions,
  addToCollectionUISelectors
} from '@audius/common'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import Card from 'components/card/mobile/Card'
import CardLineup from 'components/lineup/CardLineup'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import TextElement, { Type } from 'components/nav/mobile/TextElement'
import { useTemporaryNavContext } from 'components/nav/store/context'
import { ToastContext } from 'components/toast/ToastContext'
import useHasChangedRoute from 'hooks/useHasChangedRoute'
import NewPlaylistButton from 'pages/saved-page/components/mobile/NewPlaylistButton'
import { AppState } from 'store/types'
import { withNullGuard } from 'utils/withNullGuard'

import styles from './AddToCollection.module.css'
const { getTrackId, getTrackTitle } = addToCollectionUISelectors
const { close } = addToCollectionUIActions
const { addTrackToPlaylist, createPlaylist } = cacheCollectionsActions
const { getAccountWithOwnPlaylists } = accountSelectors

const messages = {
  title: 'Add To Playlist',
  addedToast: 'Added To Playlist!',
  createdToast: 'Playlist Created!'
}

export type AddToCollectionProps = ReturnType<typeof mapStateToProps> &
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
    goToRoute,
    close,
    addTrackToPlaylist,
    createPlaylist
  }) => {
    // Close the page if the route was changed
    useHasChangedRoute(close)
    const setters = useCallback(
      () => ({
        left: (
          <TextElement text='Cancel' type={Type.SECONDARY} onClick={close} />
        ),
        center: messages.title,
        right: null
      }),
      [close]
    )
    useTemporaryNavContext(setters)

    const { toast } = useContext(ToastContext)

    const cards = account.playlists.map((playlist: any) => {
      return (
        <Card
          key={playlist.playlist_id}
          id={playlist.playlist_id}
          userId={playlist.owner_id}
          imageSize={playlist._cover_art_sizes}
          primaryText={playlist.playlist_name}
          secondaryText={playlist.ownerName}
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
      createPlaylist(metadata, trackId!)
      toast(messages.createdToast)
      close()
    }, [trackId, trackTitle, createPlaylist, close, toast])

    return (
      <MobilePageContainer>
        <div className={styles.bodyContainer}>
          <NewPlaylistButton onClick={addToNewPlaylist} />
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
    account: getAccountWithOwnPlaylists(state),
    trackId: getTrackId(state),
    trackTitle: getTrackTitle(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    addTrackToPlaylist: (trackId: ID, playlistId: ID) =>
      dispatch(addTrackToPlaylist(trackId, playlistId)),
    createPlaylist: (metadata: Partial<Collection>, trackId: ID) =>
      dispatch(
        createPlaylist(metadata, CreatePlaylistSource.FROM_TRACK, trackId)
      ),
    close: () => dispatch(close())
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AddToCollection)
