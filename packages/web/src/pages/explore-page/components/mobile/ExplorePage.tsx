import {
  Fragment,
  useContext,
  useEffect,
  useMemo,
  ReactNode,
  useCallback
} from 'react'

import {
  UserCollection,
  SmartCollection,
  Variant as CollectionVariant,
  Status,
  User
} from '@audius/common'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import { ReactComponent as IconForYou } from 'assets/img/iconExploreMobileForYou.svg'
import { ReactComponent as IconMoods } from 'assets/img/iconExploreMobileMoods.svg'
import { ReactComponent as IconNote } from 'assets/img/iconNote.svg'
import { ReactComponent as IconUser } from 'assets/img/iconUser.svg'
import { getTab } from 'common/store/pages/explore/selectors'
import { setTab } from 'common/store/pages/explore/slice'
import {
  Tabs as ExploreTabs,
  ExploreCollectionsVariant
} from 'common/store/pages/explore/types'
import Card from 'components/card/mobile/Card'
import Header from 'components/header/mobile/Header'
import { HeaderContext } from 'components/header/mobile/HeaderContextProvider'
import CardLineup from 'components/lineup/CardLineup'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import { useMainPageHeader } from 'components/nav/store/context'
import useTabs from 'hooks/useTabs/useTabs'
import {
  CHILL_PLAYLISTS,
  UPBEAT_PLAYLISTS,
  INTENSE_PLAYLISTS,
  PROVOKING_PLAYLISTS,
  INTIMATE_PLAYLISTS,
  ExploreCollection,
  ExploreMoodCollection
} from 'pages/explore-page/collections'
import {
  playlistPage,
  albumPage,
  profilePage,
  BASE_URL,
  EXPLORE_PAGE
} from 'utils/route'

import { justForYou } from '../desktop/ExplorePage'

import ColorTile from './ColorTile'
import styles from './ExplorePage.module.css'

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
        <div className={styles.title}>{title}</div>
        {description && <div className={styles.description}>{description}</div>}
      </div>
      {children && <div className={styles.children}>{children}</div>}
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
  description: string
  playlists: UserCollection[]
  profiles: User[]
  status: Status
  formatPlaylistCardSecondaryText: (saves: number, tracks: number) => string
  formatProfileCardSecondaryText: (followerCount: number) => string
  goToRoute: (route: string) => void
}

const ExplorePage = ({
  title,
  description,
  playlists,
  profiles,
  status,
  formatPlaylistCardSecondaryText,
  formatProfileCardSecondaryText,
  goToRoute
}: ExplorePageProps) => {
  useMainPageHeader()

  const justForYouTiles = justForYou.map(
    (t: SmartCollection | ExploreCollection) => {
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
            icon={<Icon />}
            goToRoute={goToRoute}
            isIncentivized={t.incentivized}
          />
        )
      }
    }
  )

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
          onClick={() =>
            playlist.is_album
              ? goToRoute(
                  albumPage(
                    playlist.user.handle,
                    playlist.playlist_name,
                    playlist.playlist_id
                  )
                )
              : goToRoute(
                  playlistPage(
                    playlist.user.handle,
                    playlist.playlist_name,
                    playlist.playlist_id
                  )
                )
          }
        />
      )
    })
    profileCards = profiles.map((profile: User) => {
      return (
        <Card
          key={profile.user_id}
          id={profile.user_id}
          userId={profile.user_id}
          imageSize={profile._profile_picture_sizes}
          isUser
          primaryText={profile.name}
          secondaryText={formatProfileCardSecondaryText(profile.follower_count)}
          onClick={() => goToRoute(profilePage(profile.handle))}
        />
      )
    })
  }

  const memoizedElements = useMemo(() => {
    return [
      <TabBodyHeader
        key='justForYou'
        title={messages.justForYou}
        description={messages.justForYouDescription}>
        <div className={cn(styles.section, styles.tripleHeaderSectionTenTile)}>
          {justForYouTiles}
        </div>
      </TabBodyHeader>,
      <TabBodyHeader
        key='moodPlaylists'
        title={messages.moodPlaylists}
        description={messages.moodPlaylistsDescription}>
        <div className={styles.section}>{lifestyleTiles}</div>
      </TabBodyHeader>,
      <TabBodyHeader key='featuredPlaylists' title={messages.featuredPlaylists}>
        {status === Status.LOADING ? (
          <LoadingSpinner className={styles.spinner} />
        ) : (
          <CardLineup
            containerClassName={styles.lineupContainer}
            cardsClassName={styles.cardLineup}
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
            cardsClassName={styles.cardLineup}
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
      title={title}
      description={description}
      canonicalUrl={`${BASE_URL}${EXPLORE_PAGE}`}>
      <div className={styles.tabContainer}>
        <div className={styles.pageContainer}>{body}</div>
      </div>
    </MobilePageContainer>
  )
}

export default ExplorePage
