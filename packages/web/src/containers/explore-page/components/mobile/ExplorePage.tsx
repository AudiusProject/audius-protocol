import React, {
  useContext,
  useEffect,
  useMemo,
  ReactNode,
  useCallback
} from 'react'

import Spin from 'antd/lib/spin'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import { ReactComponent as IconForYou } from 'assets/img/iconExploreMobileForYou.svg'
import { ReactComponent as IconMoods } from 'assets/img/iconExploreMobileMoods.svg'
import { ReactComponent as IconNote } from 'assets/img/iconNote.svg'
import { ReactComponent as IconUser } from 'assets/img/iconUser.svg'
import {
  UserCollection,
  SmartCollection,
  Variant as CollectionVariant
} from 'common/models/Collection'
import Status from 'common/models/Status'
import { User } from 'common/models/User'
import Card from 'components/card/mobile/Card'
import MobilePageContainer from 'components/general/MobilePageContainer'
import Header from 'components/general/header/mobile/Header'
import { HeaderContext } from 'components/general/header/mobile/HeaderContextProvider'
import {
  CHILL_PLAYLISTS,
  UPBEAT_PLAYLISTS,
  INTENSE_PLAYLISTS,
  PROVOKING_PLAYLISTS,
  INTIMATE_PLAYLISTS,
  ExploreCollection,
  ExploreMoodCollection
} from 'containers/explore-page/collections'
import { setTab } from 'containers/explore-page/store/actions'
import { getTab } from 'containers/explore-page/store/selectors'
import {
  Tabs as ExploreTabs,
  ExploreCollectionsVariant
} from 'containers/explore-page/store/types'
import CardLineup from 'containers/lineup/CardLineup'
import { useMainPageHeader } from 'containers/nav/store/context'
import { useFlag } from 'containers/remote-config/hooks'
import { REMIXABLES } from 'containers/smart-collection/smartCollections'
import useTabs from 'hooks/useTabs/useTabs'
import { FeatureFlags } from 'services/remote-config'
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
  const { isEnabled: remixablesEnabled } = useFlag(FeatureFlags.REMIXABLES)
  useMainPageHeader()

  const justForYouTiles = justForYou.map(
    (t: SmartCollection | ExploreCollection) => {
      if (
        t.variant === CollectionVariant.SMART &&
        t.playlist_name === REMIXABLES.playlist_name &&
        !remixablesEnabled
      ) {
        return null
      }
      const Icon = t.icon ? t.icon : React.Fragment
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
        description={messages.justForYouDescription}
      >
        <div
          className={cn(styles.section, {
            [styles.tripleHeaderSection]: !remixablesEnabled,
            [styles.tripleHeaderSectionTenTile]: remixablesEnabled
          })}
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
          <Spin size='large' className={styles.spin} />
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
          <Spin size='large' className={styles.spin} />
        ) : (
          <CardLineup
            containerClassName={styles.lineupContainer}
            cardsClassName={styles.cardLineup}
            cards={profileCards}
          />
        )}
      </TabBodyHeader>
    ]
  }, [
    playlistCards,
    profileCards,
    justForYouTiles,
    lifestyleTiles,
    status,
    remixablesEnabled
  ])

  const initialTab = useSelector(getTab)
  const dispatch = useDispatch()
  const didSwitchTabs = useCallback(
    (_: string, to: string) => {
      dispatch(setTab(to as ExploreTabs))
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
      canonicalUrl={`${BASE_URL}${EXPLORE_PAGE}`}
    >
      <div className={styles.tabContainer}>
        <div className={styles.pageContainer}>{body}</div>
      </div>
    </MobilePageContainer>
  )
}

export default ExplorePage
