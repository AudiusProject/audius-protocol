import React, { useCallback, useContext } from 'react'

import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { CreatePlaylistSource } from 'common/models/Analytics'
import { Collection } from 'common/models/Collection'
import { ID } from 'common/models/Identifiers'
import { getAccountWithOwnPlaylists } from 'common/store/account/selectors'
import {
  addTrackToPlaylist,
  createPlaylist
} from 'common/store/cache/collections/actions'
import Card from 'components/card/mobile/Card'
import MobilePageContainer from 'components/general/MobilePageContainer'
import { ToastContext } from 'components/toast/ToastContext'
import CardLineup from 'containers/lineup/CardLineup'
import TextElement, { Type } from 'containers/nav/mobile/TextElement'
import { useTemporaryNavContext } from 'containers/nav/store/context'
import NewPlaylistButton from 'containers/saved-page/components/mobile/NewPlaylistButton'
import useHasChangedRoute from 'hooks/useHasChangedRoute'
import { newCollectionMetadata } from 'schemas'
import { AppState } from 'store/types'
import { playlistPage } from 'utils/route'
import { withNullGuard } from 'utils/withNullGuard'

import { close } from '../../../common/store/ui/add-to-playlist/actions'
import {
  getTrackId,
  getTrackTitle
} from '../../../common/store/ui/add-to-playlist/selectors'

import styles from './AddToPlaylist.module.css'

const messages = {
  title: 'Add To Playlist',
  addedToast: 'Added To Playlist!',
  createdToast: 'Playlist Created!'
}

export type AddToPlaylistProps = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const g = withNullGuard((props: AddToPlaylistProps) => {
  const { account, trackTitle } = props
  if (account && trackTitle) {
    return {
      ...props,
      account,
      trackTitle
    }
  }
})

const AddToPlaylist = g(
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
      const metadata = newCollectionMetadata({
        playlist_name: trackTitle,
        is_private: false
      })
      const tempId = `${Date.now()}`
      createPlaylist(tempId, metadata, trackId!)
      addTrackToPlaylist(trackId!, tempId)
      toast(messages.createdToast)
      goToRoute(playlistPage(account.handle, trackTitle, tempId))
      close()
    }, [
      account,
      trackId,
      trackTitle,
      createPlaylist,
      addTrackToPlaylist,
      goToRoute,
      close,
      toast
    ])

    return (
      <MobilePageContainer>
        <div className={styles.bodyContainer}>
          <NewPlaylistButton onClick={addToNewPlaylist} />
          <div className={styles.cardsContainer}>
            <CardLineup cardsClassName={styles.cardLineup} cards={cards} />
          </div>
        </div>
      </MobilePageContainer>
    )
  }
)

function mapStateToProps(state: AppState) {
  return {
    account: getAccountWithOwnPlaylists(state, {}),
    trackId: getTrackId(state),
    trackTitle: getTrackTitle(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    addTrackToPlaylist: (trackId: ID, playlistId: ID | string) =>
      dispatch(addTrackToPlaylist(trackId, playlistId)),
    createPlaylist: (tempId: string, metadata: Collection, trackId: ID) =>
      dispatch(
        createPlaylist(
          tempId,
          metadata,
          CreatePlaylistSource.FROM_TRACK,
          trackId
        )
      ),
    close: () => dispatch(close())
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AddToPlaylist)
