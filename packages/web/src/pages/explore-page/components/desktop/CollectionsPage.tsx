import { useCallback, MouseEvent } from 'react'

import { Status, UserCollection, ID } from '@audius/common/models'

import { ArtistPopover } from 'components/artist/ArtistPopover'
import Card from 'components/card/desktop/Card'
import Header from 'components/header/desktop/Header'
import CardLineup from 'components/lineup/CardLineup'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import Page from 'components/page/Page'
import { useOrderedLoad } from 'hooks/useOrderedLoad'
import {
  collectionPage,
  fullCollectionPage,
  BASE_URL,
  EXPLORE_PAGE,
  profilePage
} from 'utils/route'

import styles from './CollectionsPage.module.css'

export type CollectionsPageProps = {
  title: string
  description: string
  collections: UserCollection[]
  status: Status
  onClickReposts: (id: ID) => void
  onClickFavorites: (id: ID) => void
  goToRoute: (route: string) => void
}

const CollectionsPage = ({
  title,
  description,
  collections,
  status,
  onClickReposts,
  onClickFavorites,
  goToRoute
}: CollectionsPageProps) => {
  const { isLoading: isLoadingPlaylist, setDidLoad: setDidLoadPlaylist } =
    useOrderedLoad(collections.length)

  const goToProfilePage = useCallback(
    (e: MouseEvent, handle: string) => {
      e.stopPropagation()
      goToRoute(profilePage(handle))
    },
    [goToRoute]
  )

  const header = (
    <Header
      primary={title}
      secondary={description}
      containerStyles={description ? styles.header : null}
      wrapperClassName={description ? styles.headerWrapper : null}
    />
  )

  const cards = collections.map((playlist, i) => {
    const secondaryText = (
      <ArtistPopover handle={playlist.user.handle}>
        <span
          className={styles.userName}
          onClick={(e: MouseEvent) => {
            e.preventDefault()
            goToProfilePage(e, playlist.user.handle)
          }}
        >
          {playlist.user.name}
        </span>
      </ArtistPopover>
    )

    return (
      <Card
        index={i}
        isLoading={isLoadingPlaylist(i)}
        setDidLoad={setDidLoadPlaylist}
        key={playlist.playlist_id}
        id={playlist.playlist_id}
        userId={playlist.playlist_owner_id}
        imageSize={playlist._cover_art_sizes}
        isPlaylist={!playlist.is_album}
        isPublic={!playlist.is_private}
        size='large'
        playlistName={playlist.playlist_name}
        playlistId={playlist.playlist_id}
        handle={playlist.user.handle}
        primaryText={playlist.playlist_name}
        secondaryText={secondaryText}
        isReposted={playlist.has_current_user_reposted}
        isSaved={playlist.has_current_user_saved}
        cardCoverImageSizes={playlist._cover_art_sizes}
        href={fullCollectionPage(
          playlist.user.handle,
          playlist.playlist_name,
          playlist.playlist_id,
          playlist.permalink,
          playlist.is_album
        )}
        reposts={playlist.repost_count}
        favorites={playlist.save_count}
        trackCount={playlist.playlist_contents.track_ids.length}
        onClickReposts={() => onClickReposts(playlist.playlist_id)}
        onClickFavorites={() => onClickFavorites(playlist.playlist_id)}
        onClick={(e) => {
          e.preventDefault()
          goToRoute(
            collectionPage(
              playlist.user.handle,
              playlist.playlist_name,
              playlist.playlist_id,
              playlist.permalink,
              playlist.is_album
            )
          )
        }}
      />
    )
  })

  return (
    <Page
      title={title}
      description={description}
      canonicalUrl={`${BASE_URL}${EXPLORE_PAGE}`}
      contentClassName={styles.page}
      header={header}
    >
      {status === Status.LOADING ? (
        <LoadingSpinner className={styles.spinner} />
      ) : (
        <CardLineup cards={cards} cardsClassName={styles.cardsContainer} />
      )}
    </Page>
  )
}

export default CollectionsPage
