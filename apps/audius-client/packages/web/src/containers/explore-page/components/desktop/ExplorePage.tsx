import React, { useCallback } from 'react'
import Lottie from 'react-lottie'

import User from 'models/User'
import { UserCollection, Variant as CollectionVariant } from 'models/Collection'
import { Status } from 'store/types'

import Page from 'components/general/Page'
import Header from 'components/general/header/desktop/Header'
import { BASE_URL, EXPLORE_PAGE, stripBaseUrl } from 'utils/route'
import CollectionArtCard from 'components/card/desktop/CollectionArtCard'
import UserArtCard from 'components/card/desktop/UserArtCard'
import Section, { Layout } from './Section'
import { useOrderedLoad } from 'hooks/useOrderedLoad'
import PerspectiveCard, {
  TextInterior,
  EmojiInterior
} from 'components/perspective-card/PerspectiveCard'

import loadingSpinner from 'assets/animations/loadingSpinner.json'

import styles from './ExplorePage.module.css'
import {
  HEAVY_ROTATION,
  BEST_NEW_RELEASES,
  UNDER_THE_RADAR,
  MOST_LOVED,
  FEELING_LUCKY
} from 'containers/smart-collection/smartCollections'
import {
  LET_THEM_DJ,
  TOP_ALBUMS,
  TRENDING_PLAYLISTS,
  TRENDING_UNDERGROUND,
  CHILL_PLAYLISTS,
  UPBEAT_PLAYLISTS,
  INTENSE_PLAYLISTS,
  PROVOKING_PLAYLISTS,
  INTIMATE_PLAYLISTS
} from 'containers/explore-page/collections'
import { ExploreCollectionsVariant } from 'containers/explore-page/store/types'
import { useIsTrendingUndergroundEnabled } from 'containers/trending-underground/TrendingUndergroundPage'

const messages = {
  featuredPlaylists: 'Playlists We Love Right Now',
  featuredProfiles: 'Artists You Should Follow',
  exploreMorePlaylists: 'Explore More Playlists',
  exploreMoreProfiles: 'Explore More Artists',
  justForYou: 'Just For You',
  justForYouSubtitle: `Content curated for you based on your likes,
reposts, and follows. Refreshes often so if you like a track, favorite it.`,
  lifestyle: 'Playlists to Fit Your Mood',
  lifestyleSubtitle: 'Playlists made by Audius users, sorted by mood and feel'
}

const justForYou = [
  TRENDING_PLAYLISTS,
  HEAVY_ROTATION,
  LET_THEM_DJ,
  BEST_NEW_RELEASES,
  UNDER_THE_RADAR,
  TOP_ALBUMS,
  MOST_LOVED,
  FEELING_LUCKY
]

const lifestyle = [
  CHILL_PLAYLISTS,
  UPBEAT_PLAYLISTS,
  INTENSE_PLAYLISTS,
  PROVOKING_PLAYLISTS,
  INTIMATE_PLAYLISTS
]

export type ExplorePageProps = {
  title: string
  description: string
  playlists: UserCollection[]
  profiles: User[]
  status: Status
  goToRoute: (route: string) => void
}

export const useJustForYouTiles = (isUnderground: boolean) => {
  const justForYouTiles = [...justForYou]
  if (isUnderground) {
    justForYouTiles.splice(1, 0, TRENDING_UNDERGROUND)
  }
  return justForYouTiles
}

const ExplorePage = ({
  title,
  description,
  playlists,
  profiles,
  status,
  goToRoute
}: ExplorePageProps) => {
  const {
    isLoading: isLoadingPlaylist,
    setDidLoad: setDidLoadPlaylist
  } = useOrderedLoad(playlists.length)
  const {
    isLoading: isLoadingProfiles,
    setDidLoad: setDidLoadProfile
  } = useOrderedLoad(profiles.length)

  const { isEnabled: isUnderground } = useIsTrendingUndergroundEnabled()
  const justForYouTiles = useJustForYouTiles(!!isUnderground)
  const header = <Header primary={title} containerStyles={styles.header} />
  const onClickCard = useCallback(
    (url: string) => {
      if (url.startsWith(BASE_URL)) {
        goToRoute(stripBaseUrl(url))
      } else if (url.startsWith('http')) {
        const win = window.open(url, '_blank')
        if (win) win.focus()
      } else {
        goToRoute(url)
      }
    },
    [goToRoute]
  )

  return (
    <Page
      title={title}
      description={description}
      canonicalUrl={`${BASE_URL}${EXPLORE_PAGE}`}
      contentClassName={styles.page}
      header={header}
    >
      <Section
        title={messages.justForYou}
        subtitle={messages.justForYouSubtitle}
        layout={
          isUnderground
            ? Layout.TWO_COLUMN_DYNAMIC_WITH_DOUBLE_LEADING_ELEMENT
            : Layout.TWO_COLUMN_DYNAMIC_WITH_LEADING_ELEMENT
        }
      >
        {justForYouTiles.map(i => {
          const title =
            i.variant === CollectionVariant.SMART ? i.playlist_name : i.title
          const subtitle =
            i.variant === CollectionVariant.SMART ? i.description : i.subtitle
          const Icon = i.icon ? i.icon : React.Fragment
          return (
            <PerspectiveCard
              key={title}
              backgroundGradient={i.gradient}
              shadowColor={i.shadow}
              useOverlayBlendMode={
                i.variant !== ExploreCollectionsVariant.DIRECT_LINK
              }
              // @ts-ignore
              backgroundIcon={<Icon />}
              onClick={() => onClickCard(i.link)}
              isIncentivized={!!i.incentivized}
            >
              <TextInterior title={title} subtitle={subtitle} />
            </PerspectiveCard>
          )
        })}
      </Section>

      <Section title={messages.lifestyle} subtitle={messages.lifestyleSubtitle}>
        {lifestyle.map(i => (
          <PerspectiveCard
            key={i.title}
            backgroundGradient={i.gradient}
            shadowColor={i.shadow}
            onClick={() => goToRoute(i.link)}
          >
            <EmojiInterior title={i.title} emoji={i.emoji} />
          </PerspectiveCard>
        ))}
      </Section>

      <Section
        title={messages.featuredPlaylists}
        expandable
        expandText={messages.exploreMorePlaylists}
      >
        {status === Status.LOADING ? (
          <div className={styles.loadingSpinner}>
            <Lottie
              options={{
                loop: true,
                autoplay: true,
                animationData: loadingSpinner
              }}
            />
          </div>
        ) : (
          playlists.map((playlist: UserCollection, i: number) => {
            return (
              <CollectionArtCard
                key={playlist.playlist_id}
                id={playlist.playlist_id}
                index={i}
                isLoading={isLoadingPlaylist(i)}
                setDidLoad={setDidLoadPlaylist}
              />
            )
          })
        )}
      </Section>

      <Section
        title={messages.featuredProfiles}
        expandable
        expandText={messages.exploreMoreProfiles}
      >
        {status === Status.LOADING ? (
          <div className={styles.loadingSpinner}>
            <Lottie
              options={{
                loop: true,
                autoplay: true,
                animationData: loadingSpinner
              }}
            />
          </div>
        ) : (
          profiles.map((profile: User, i: number) => {
            return (
              <UserArtCard
                key={profile.user_id}
                id={profile.user_id}
                index={i}
                isLoading={isLoadingProfiles(i)}
                setDidLoad={setDidLoadProfile}
              />
            )
          })
        )}
      </Section>
    </Page>
  )
}

export default ExplorePage
