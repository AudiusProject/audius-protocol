import { useCallback } from 'react'

import { useFeaturedPlaylists, useFeaturedProfiles } from '@audius/common/api'
import {
  Variant as CollectionVariant,
  UserCollection,
  User,
  Variant
} from '@audius/common/models'
import { ExploreCollectionsVariant } from '@audius/common/store'
import { route } from '@audius/common/utils'
import { IconExplore } from '@audius/harmony'
import Lottie from 'lottie-react'
import { useNavigate } from 'react-router-dom-v5-compat'

import loadingSpinner from 'assets/animations/loadingSpinner.json'
import {
  HEAVY_ROTATION,
  BEST_NEW_RELEASES,
  UNDER_THE_RADAR,
  MOST_LOVED,
  REMIXABLES,
  FEELING_LUCKY
} from 'common/store/smart-collection/smartCollections'
import CollectionArtCard from 'components/card-legacy/desktop/CollectionArtCard'
import UserArtCard from 'components/card-legacy/desktop/UserArtCard'
import { Header } from 'components/header/desktop/Header'
import Page from 'components/page/Page'
import PerspectiveCard, {
  TextInterior,
  EmojiInterior
} from 'components/perspective-card/PerspectiveCard'
import { useIsUSDCEnabled } from 'hooks/useIsUSDCEnabled'
import { smartCollectionIcons } from 'pages/collection-page/smartCollectionIcons'
import {
  LET_THEM_DJ,
  TOP_ALBUMS,
  TRENDING_PLAYLISTS,
  TRENDING_UNDERGROUND,
  CHILL_PLAYLISTS,
  UPBEAT_PLAYLISTS,
  INTENSE_PLAYLISTS,
  PROVOKING_PLAYLISTS,
  INTIMATE_PLAYLISTS,
  PREMIUM_TRACKS
} from 'pages/explore-page/collections'
import { BASE_URL, stripBaseUrl } from 'utils/route'

import styles from './ExplorePage.module.css'
import Section, { Layout } from './Section'

const { EXPLORE_PAGE } = route

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

export const justForYou = [
  PREMIUM_TRACKS,
  TRENDING_PLAYLISTS,
  TRENDING_UNDERGROUND,
  HEAVY_ROTATION,
  LET_THEM_DJ,
  BEST_NEW_RELEASES,
  UNDER_THE_RADAR,
  TOP_ALBUMS,
  REMIXABLES,
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
  pageTitle: string
  description: string
}

const ExplorePage = ({ title, pageTitle, description }: ExplorePageProps) => {
  const isUSDCPurchasesEnabled = useIsUSDCEnabled()
  const justForYouTiles = justForYou.filter((tile) => {
    const isPremiumTracksTile =
      tile.variant === ExploreCollectionsVariant.DIRECT_LINK &&
      tile.title === PREMIUM_TRACKS.title
    return !isPremiumTracksTile || isUSDCPurchasesEnabled
  })

  const { data: playlists, isLoading: isLoadingPlaylists } =
    useFeaturedPlaylists()
  const { data: profiles, isLoading: isLoadingProfiles } = useFeaturedProfiles()

  const navigate = useNavigate()

  const header = (
    <Header
      icon={IconExplore}
      primary={title}
      containerStyles={styles.header}
    />
  )
  const onClickCard = useCallback(
    (url: string) => {
      if (url.startsWith(BASE_URL)) {
        navigate(stripBaseUrl(url))
      } else if (url.startsWith('http')) {
        const win = window.open(url, '_blank')
        if (win) win.focus()
      } else {
        navigate(url)
      }
    },
    [navigate]
  )

  return (
    <Page
      title={pageTitle}
      description={description}
      canonicalUrl={`${BASE_URL}${EXPLORE_PAGE}`}
      contentClassName={styles.page}
      header={header}
    >
      <Section
        title={messages.justForYou}
        subtitle={messages.justForYouSubtitle}
        layout={Layout.TWO_COLUMN_DYNAMIC_WITH_LEADING_ELEMENT}
      >
        {justForYouTiles.map((i) => {
          const title =
            i.variant === CollectionVariant.SMART ? i.playlist_name : i.title
          const subtitle =
            i.variant === CollectionVariant.SMART ? i.description : i.subtitle
          const Icon =
            i.variant === Variant.SMART
              ? smartCollectionIcons[
                  i.playlist_name as keyof typeof smartCollectionIcons
                ]
              : i.icon
          return (
            <PerspectiveCard
              key={title}
              backgroundGradient={i.gradient}
              shadowColor={i.shadow}
              useOverlayBlendMode={
                i.variant !== ExploreCollectionsVariant.DIRECT_LINK
              }
              backgroundIcon={
                Icon ? (
                  <Icon height={512} width={512} color='inverse' />
                ) : undefined
              }
              backgroundIconClassName={
                title === PREMIUM_TRACKS.title
                  ? styles.premiumTracksBackgroundIcon
                  : undefined
              }
              onClick={() => onClickCard(i.link)}
              isIncentivized={!!i.incentivized}
              sensitivity={i.cardSensitivity}
            >
              <TextInterior title={title} subtitle={subtitle} />
            </PerspectiveCard>
          )
        })}
      </Section>

      <Section title={messages.lifestyle} subtitle={messages.lifestyleSubtitle}>
        {lifestyle.map((i) => (
          <PerspectiveCard
            key={i.title}
            backgroundGradient={i.gradient}
            shadowColor={i.shadow}
            onClick={() => navigate(i.link)}
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
        {isLoadingPlaylists ? (
          <div className={styles.loadingSpinner}>
            <Lottie loop autoplay animationData={loadingSpinner} />
          </div>
        ) : (
          playlists?.map((playlist: UserCollection, i: number) => {
            return (
              <CollectionArtCard
                key={playlist.playlist_id}
                id={playlist.playlist_id}
                index={i}
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
        {isLoadingProfiles ? (
          <div className={styles.loadingSpinner}>
            <Lottie loop autoplay animationData={loadingSpinner} />
          </div>
        ) : (
          profiles?.map((profile: User, i: number) => {
            return (
              <UserArtCard
                key={profile.user_id}
                id={profile.user_id}
                index={i}
              />
            )
          })
        )}
      </Section>
    </Page>
  )
}

export default ExplorePage
