import { useContext, useEffect } from 'react'

import { Status, UserCollection, ID } from '@audius/common/models'

import {} from '@audius/common'

import Card from 'components/card/mobile/Card'
import Header from 'components/header/mobile/Header'
import { HeaderContext } from 'components/header/mobile/HeaderContextProvider'
import CardLineup from 'components/lineup/CardLineup'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import { useSubPageHeader } from 'components/nav/store/context'
import { collectionPage, BASE_URL, EXPLORE_PAGE } from 'utils/route'

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

const ExplorePage = ({
  title,
  description,
  collections,
  status,
  onClickReposts,
  onClickFavorites,
  goToRoute
}: CollectionsPageProps) => {
  useSubPageHeader()

  const playlistCards = collections.map((playlist: UserCollection) => {
    return (
      <Card
        key={playlist.playlist_id}
        id={playlist.playlist_id}
        userId={playlist.playlist_owner_id}
        imageSize={playlist._cover_art_sizes}
        primaryText={playlist.playlist_name}
        secondaryText={playlist.user.name}
        trackCount={playlist.playlist_contents.track_ids.length}
        reposts={playlist.repost_count}
        favorites={playlist.save_count}
        isPlaylist={!playlist.is_album}
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

  const cards = (
    <CardLineup
      containerClassName={styles.lineupContainer}
      cards={playlistCards}
    />
  )

  const { setHeader } = useContext(HeaderContext)
  useEffect(() => {
    setHeader(
      <>
        <Header title={title} />
      </>
    )
  }, [setHeader, title])

  return (
    <MobilePageContainer
      title={title}
      description={description}
      canonicalUrl={`${BASE_URL}${EXPLORE_PAGE}`}
      containerClassName={styles.pageContainer}
      hasDefaultHeader
    >
      {status === Status.LOADING ? (
        <LoadingSpinner className={styles.spinner} />
      ) : (
        cards
      )}
    </MobilePageContainer>
  )
}

export default ExplorePage
