import { useContext, useEffect, ReactNode, useCallback, useState } from 'react'

import { useFeaturedPlaylists, useFeaturedProfiles } from '@audius/common/api'
import {
  Variant as CollectionVariant,
  SmartCollection,
  User,
  Variant
} from '@audius/common/models'
import {
  ExplorePageTabs as ExploreTabs,
  ExploreCollectionsVariant
} from '@audius/common/store'
import { removeNullable, route } from '@audius/common/utils'
import {
  IconStars as IconForYou,
  IconMood as IconMoods,
  IconNote,
  IconUser
} from '@audius/harmony'
import cn from 'classnames'
import { useNavigate } from 'react-router-dom-v5-compat'

import { CollectionCard } from 'components/collection'
import Header from 'components/header/mobile/Header'
import { HeaderContext } from 'components/header/mobile/HeaderContextProvider'
import CardLineup from 'components/lineup/CardLineup'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import { useMainPageHeader } from 'components/nav/mobile/NavContext'
import { UserCard } from 'components/user-card'
import { useIsUSDCEnabled } from 'hooks/useIsUSDCEnabled'
import useTabs from 'hooks/useTabs/useTabs'
import { smartCollectionIcons } from 'pages/collection-page/smartCollectionIcons'
import {
  CHILL_PLAYLISTS,
  UPBEAT_PLAYLISTS,
  INTENSE_PLAYLISTS,
  PROVOKING_PLAYLISTS,
  INTIMATE_PLAYLISTS,
  TRENDING_PLAYLISTS,
  TRENDING_UNDERGROUND,
  ExploreCollection,
  ExploreMoodCollection,
  PREMIUM_TRACKS
} from 'pages/explore-page/collections'
import { BASE_URL } from 'utils/route'

import ColorTile from './ColorTile'
import styles from './ExplorePage.module.css'

const { EXPLORE_PAGE } = route

const messages = {
  pageName: 'Explore',
  pageDescription: 'Explore featured content on Audius',
  featuredPlaylists: 'Featured Playlists',
  featuredArtists: 'Featured Artists',
  justForYou: 'Just For You',
  justForYouDescription: `Content curated for
you based on your likes, reposts, and follows. Refreshes often so if you like a track, favorite it.`,
  moodPlaylists: 'Playlists to Fit Your Mood',
  moodPlaylistsDescription:
    'Playlists made by Audius users, sorted by mood and feel.'
}

// Updated to only include the three requested collections
const justForYou = [PREMIUM_TRACKS, TRENDING_PLAYLISTS, TRENDING_UNDERGROUND]

const lifestyle = [
  CHILL_PLAYLISTS,
  UPBEAT_PLAYLISTS,
  INTENSE_PLAYLISTS,
  PROVOKING_PLAYLISTS,
  INTIMATE_PLAYLISTS
]

const TabBodyHeader = ({
  title,
  description,
  children
}: {
  title: string
  description?: string
  children?: ReactNode
}) => {
  return (
    <div className={styles.tabBodyHeader}>
      <div className={styles.headerWrapper}>
        <h2 className={styles.title}>{title}</h2>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {children && <div>{children}</div>}
    </div>
  )
}

const tabHeaders = [
  {
    icon: <IconForYou />,
    text: ExploreTabs.FOR_YOU,
    label: ExploreTabs.FOR_YOU
  },
  { icon: <IconMoods />, text: ExploreTabs.MOODS, label: ExploreTabs.MOODS },
  {
    icon: <IconNote />,
    text: ExploreTabs.PLAYLISTS,
    label: ExploreTabs.PLAYLISTS
  },
  {
    icon: <IconUser />,
    text: ExploreTabs.PROFILES,
    label: ExploreTabs.PROFILES
  }
]

export type ExplorePageProps = {
  title: string
  pageTitle: string
  description: string
}

const ExplorePage = ({ pageTitle, description }: ExplorePageProps) => {
  useMainPageHeader()
  const [currentTab, setCurrentTab] = useState<ExploreTabs>(ExploreTabs.FOR_YOU)

  const navigate = useNavigate()

  const isUSDCPurchasesEnabled = useIsUSDCEnabled()
  const justForYouTiles = justForYou
    .map((t: SmartCollection | ExploreCollection) => {
      const isPremiumTracksTile =
        t.variant === ExploreCollectionsVariant.DIRECT_LINK &&
        t.title === PREMIUM_TRACKS.title
      if (!isUSDCPurchasesEnabled && isPremiumTracksTile) {
        return null
      }
      const Icon =
        t.variant === Variant.SMART
          ? smartCollectionIcons[
              t.playlist_name as keyof typeof smartCollectionIcons
            ]
          : t.icon
      if (t.variant === CollectionVariant.SMART) {
        return (
          <ColorTile
            key={t.playlist_name}
            title={t.playlist_name}
            link={t.link}
            description={t.description}
            gradient={t.gradient}
            shadow={t.shadow}
            icon={
              Icon ? (
                <Icon color='inverse' width={200} height={200} />
              ) : undefined
            }
            goToRoute={navigate}
          />
        )
      } else {
        return (
          <ColorTile
            key={t.title}
            title={t.title}
            link={t.link}
            description={t.subtitle}
            gradient={t.gradient}
            shadow={t.shadow}
            icon={
              Icon ? (
                <Icon color='inverse' width={200} height={200} />
              ) : undefined
            }
            goToRoute={navigate}
            isIncentivized={t.incentivized}
          />
        )
      }
    })
    .filter(removeNullable)

  const lifestyleTiles = lifestyle.map((t: ExploreMoodCollection) => {
    return (
      <ColorTile
        key={t.title}
        title={t.title}
        link={t.link}
        description={t.subtitle}
        gradient={t.gradient}
        shadow={t.shadow}
        emoji={
          t.variant === ExploreCollectionsVariant.MOOD ? t.emoji : undefined
        }
        goToRoute={navigate}
      />
    )
  })

  const { data: playlists = [], isLoading: isLoadingPlaylists } =
    useFeaturedPlaylists()
  const { data: profiles = [], isLoading: isLoadingProfiles } =
    useFeaturedProfiles()

  const elements = [
    <TabBodyHeader
      key='justForYou'
      title={messages.justForYou}
      description={messages.justForYouDescription}
    >
      <div
        className={cn(styles.section, styles.quadrupleHeaderSectionElevenTile)}
      >
        {justForYouTiles}
      </div>
    </TabBodyHeader>,
    <TabBodyHeader
      key='moodPlaylists'
      title={messages.moodPlaylists}
      description={messages.moodPlaylistsDescription}
    >
      <div className={styles.section}>{lifestyleTiles}</div>
    </TabBodyHeader>,
    <TabBodyHeader key='featuredPlaylists' title={messages.featuredPlaylists}>
      {isLoadingPlaylists ? (
        <LoadingSpinner className={styles.spinner} />
      ) : (
        <CardLineup
          containerClassName={styles.lineupContainer}
          cards={
            !isLoadingPlaylists
              ? playlists.map((playlist) => (
                  <CollectionCard
                    key={playlist.playlist_id}
                    id={playlist.playlist_id}
                    size='xs'
                  />
                ))
              : []
          }
        />
      )}
    </TabBodyHeader>,

    <TabBodyHeader key='featuredArtists' title={messages.featuredArtists}>
      {isLoadingProfiles ? (
        <LoadingSpinner className={styles.spinner} />
      ) : (
        <CardLineup
          containerClassName={styles.lineupContainer}
          cards={
            !isLoadingProfiles
              ? profiles.map((profile: User) => (
                  <UserCard
                    key={profile.user_id}
                    id={profile.user_id}
                    size='xs'
                  />
                ))
              : []
          }
        />
      )}
    </TabBodyHeader>
  ]

  const didSwitchTabs = useCallback((_: string, to: string) => {
    setCurrentTab(to as ExploreTabs)
  }, [])

  const { tabs, body } = useTabs({
    tabs: tabHeaders,
    elements,
    initialTab: currentTab,
    didChangeTabsFrom: didSwitchTabs
  })

  const { setHeader } = useContext(HeaderContext)
  useEffect(() => {
    setHeader(
      <>
        <Header className={styles.header} title={messages.pageName} />
        <div className={styles.tabBar}>{tabs}</div>
      </>
    )
  }, [setHeader, tabs])

  return (
    <MobilePageContainer
      title={pageTitle}
      description={description}
      canonicalUrl={`${BASE_URL}${EXPLORE_PAGE}`}
    >
      <div className={styles.tabContainer}>
        <div className={styles.pageContainer}>{body}</div>
      </div>
    </MobilePageContainer>
  )
}

export default ExplorePage
