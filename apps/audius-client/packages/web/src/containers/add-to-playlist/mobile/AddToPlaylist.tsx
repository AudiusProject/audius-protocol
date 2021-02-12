import React, { useCallback, useContext } from 'react'
import { connect } from 'react-redux'
import { push as pushRoute } from 'connected-react-router'
import { Dispatch } from 'redux'

import { AppState } from 'store/types'
import { close } from '../store/actions'
import { getTrackId, getTrackTitle } from '../store/selectors'
import { getAccountWithOwnPlaylists } from 'store/account/selectors'
import {
  addTrackToPlaylist,
  createPlaylist
} from 'store/cache/collections/actions'

import { playlistPage } from 'utils/route'
import Card from 'components/card/mobile/Card'
import CardLineup from 'containers/lineup/CardLineup'
import MobilePageContainer from 'components/general/MobilePageContainer'
import { useTemporaryNavContext } from 'containers/nav/store/context'
import TextElement, { Type } from 'containers/nav/mobile/TextElement'

import styles from './AddToPlaylist.module.css'
import { ID } from 'models/common/Identifiers'
import NewPlaylistButton from 'containers/saved-page/components/mobile/NewPlaylistButton'
import Collection from 'models/Collection'
import { newCollectionMetadata } from 'schemas'
import { ToastContext } from 'components/toast/ToastContext'
import { CreatePlaylistSource } from 'services/analytics'
import { withNullGuard } from 'utils/withNullGuard'

const messages = {
  title: 'Add To Playlist',
  addedToast: 'Added To Playlist!',
  createdToast: 'Playlist Created!'
}

export type AddToPlaylistProps = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const g = withNullGuard((props: AddToPlaylistProps) => {
  const { account } = props
  if (account) {
    return {
      ...props,
      account
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
