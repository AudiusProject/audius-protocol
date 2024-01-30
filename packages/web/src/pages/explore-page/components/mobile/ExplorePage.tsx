import React, {
  Fragment,
  useContext,
  useEffect,
  useMemo,
  ReactNode,
  useCallback
} from 'react'

import {
  explorePageActions,
  ExplorePageTabs as ExploreTabs,
  ExploreCollectionsVariant,
  explorePageSelectors,
  removeNullable
} from '@audius/common'
import {
  Variant,
  Status,
  UserCollection,
  SmartCollection,
  User
} from '@audius/common/models'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import IconForYou from 'assets/img/iconExploreMobileForYou.svg'
import IconMoods from 'assets/img/iconExploreMobileMoods.svg'
import IconNote from 'assets/img/iconNote.svg'
import IconUser from 'assets/img/iconUser.svg'
import Card from 'components/card/mobile/Card'
import Header from 'components/header/mobile/Header'
import { HeaderContext } from 'components/header/mobile/HeaderContextProvider'
import CardLineup from 'components/lineup/CardLineup'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import { useMainPageHeader } from 'components/nav/store/context'
import { useIsUSDCEnabled } from 'hooks/useIsUSDCEnabled'
import useTabs from 'hooks/useTabs/useTabs'
import {
  CHILL_PLAYLISTS,
  UPBEAT_PLAYLISTS,
  INTENSE_PLAYLISTS,
  PROVOKING_PLAYLISTS,
  INTIMATE_PLAYLISTS,
  ExploreCollection,
  ExploreMoodCollection,
  PREMIUM_TRACKS
} from 'pages/explore-page/collections'
import {
  collectionPage,
  profilePage,
  BASE_URL,
  EXPLORE_PAGE
} from 'utils/route'

import { justForYou } from '../desktop/ExplorePage'

import ColorTile from './ColorTile'
import styles from './ExplorePage.module.css'
const { getTab } = explorePageSelectors
const { setTab } = explorePageActions

const messages = {
  pageName: 'Explore',
  pageDescription: 'Explore featured content on Audius',
  forYou: 'For You',
  moods: 'Moods',
  playlists: 'Playlists',
  artists: 'Artists',
  featuredPlaylists: 'Featured Playlists',
  featuredArtists: 'Featured Artists',
  justForYou: 'Just For You',
  justForYouDescription: `Content curated for
you based on your likes, reposts, and follows. Refreshes often so if you like a track, favorite it.`,
  moodPlaylists: 'Playlists to Fit Your Mood',
  moodPlaylistsDescription:
    'Playlists made by Audius users, sorted by mood and feel.'
}

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
  { icon: <IconForYou />, text: messages.forYou, label: ExploreTabs.FOR_YOU },
  { icon: <IconMoods />, text: messages.moods, label: ExploreTabs.MOODS },
  {
    icon: <IconNote />,
    text: messages.playlists,
    label: ExploreTabs.PLAYLISTS
  },
  { icon: <IconUser />, text: messages.artists, label: ExploreTabs.PROFILES }
]

export type ExplorePageProps = {
  title: string
  pageTitle: string
  description: string
  playlists: UserCollection[]
  profiles: User[]
  status: Status
  formatPlaylistCardSecondaryText: (saves: number, tracks: number) => string
  formatProfileCardSecondaryText: (followerCount: number) => string
  goToRoute: (route: string) => void
}

const ExplorePage = ({
  pageTitle,
  description,
  playlists,
  profiles,
  status,
  formatPlaylistCardSecondaryText,
  formatProfileCardSecondaryText,
  goToRoute
}: ExplorePageProps) => {
  useMainPageHeader()

  const isUSDCPurchasesEnabled = useIsUSDCEnabled()
  const justForYouTiles = justForYou
    .map((t: SmartCollection | ExploreCollection) => {
      const isPremiumTracksTile =
        t.variant === ExploreCollectionsVariant.DIRECT_LINK &&
        t.title === PREMIUM_TRACKS.title
      if (!isUSDCPurchasesEnabled && isPremiumTracksTile) {
        return null
      }
      const Icon = t.icon ? t.icon : Fragment
      if (t.variant === CollectionVariant.SMART) {
        return (
          <ColorTile
            key={t.playlist_name}
            title={t.playlist_name}
            link={t.link}
            description={t.description}
            gradient={t.gradient}
            shadow={t.shadow}
            // @ts-ignore
            icon={<Icon />}
            goToRoute={goToRoute}
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
            // @ts-ignore
            icon={
              <Icon
                className={
                  t.title === PREMIUM_TRACKS.title
                    ? styles.premiumTracksBackgroundIcon
                    : undefined
                }
              />
            }
            goToRoute={goToRoute}
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
        goToRoute={goToRoute}
      />
    )
  })

  let playlistCards: JSX.Element[]
  let profileCards: JSX.Element[]
  if (status === Status.LOADING) {
    playlistCards = []
    profileCards = []
  } else {
    playlistCards = playlists.map((playlist: UserCollection) => {
      const href = collectionPage(
        playlist.user.handle,
        playlist.playlist_name,
        playlist.playlist_id,
        playlist.permalink,
        playlist.is_album
      )

      return (
        <Card
          key={playlist.playlist_id}
          id={playlist.playlist_id}
          userId={playlist.playlist_owner_id}
          imageSize={playlist._cover_art_sizes}
          primaryText={playlist.playlist_name}
          secondaryText={formatPlaylistCardSecondaryText(
            playlist.save_count,
            playlist.playlist_contents.track_ids.length
          )}
          href={href}
          onClick={(e: React.MouseEvent) => {
            e.preventDefault()
            goToRoute(href)
          }}
        />
      )
    })
    profileCards = profiles.map((profile: User) => {
      const href = profilePage(profile.handle)
      return (
        <Card
          key={profile.user_id}
          id={profile.user_id}
          userId={profile.user_id}
          imageSize={profile._profile_picture_sizes}
          isUser
          primaryText={profile.name}
          secondaryText={formatProfileCardSecondaryText(profile.follower_count)}
          href={href}
          onClick={(e: React.MouseEvent) => {
            e.preventDefault()
            goToRoute(href)
          }}
        />
      )
    })
  }

  const memoizedElements = useMemo(() => {
    return [
      <TabBodyHeader
        key='justForYou'
        title={messages.justForYou}
        description={messages.justForYouDescription}
      >
        <div
          className={cn(
            styles.section,
            styles.quadrupleHeaderSectionElevenTile
          )}
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
        {status === Status.LOADING ? (
          <LoadingSpinner className={styles.spinner} />
        ) : (
          <CardLineup
            containerClassName={styles.lineupContainer}
            cards={playlistCards}
          />
        )}
      </TabBodyHeader>,
      <TabBodyHeader key='featuredArtists' title={messages.featuredArtists}>
        {status === Status.LOADING ? (
          <LoadingSpinner className={styles.spinner} />
        ) : (
          <CardLineup
            containerClassName={styles.lineupContainer}
            cards={profileCards}
          />
        )}
      </TabBodyHeader>
    ]
  }, [playlistCards, profileCards, justForYouTiles, lifestyleTiles, status])

  const initialTab = useSelector(getTab)
  const dispatch = useDispatch()
  const didSwitchTabs = useCallback(
    (_: string, to: string) => {
      dispatch(setTab({ tab: to as ExploreTabs }))
    },
    [dispatch]
  )
  const { tabs, body } = useTabs({
    tabs: tabHeaders,
    elements: memoizedElements,
    initialTab,
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
