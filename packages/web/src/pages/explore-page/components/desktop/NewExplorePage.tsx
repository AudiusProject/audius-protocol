import { useCallback } from 'react'

import { useFeaturedPlaylists, useFeaturedProfiles } from '@audius/common/api'
import {
  Variant as CollectionVariant,
  User,
  Variant
} from '@audius/common/models'
import { TQCollection } from '@audius/common/src/api/tan-query/models'
import { ExploreCollectionsVariant } from '@audius/common/store'
import {
  Paper,
  Text,
  Flex,
  IconNote,
  IconAlbum,
  IconPlaylists,
  TextInput,
  TextInputSize,
  IconSearch,
  spacing,
  IconUser,
  Button,
  TextLink
} from '@audius/harmony'
import { useNavigate } from 'react-router-dom-v5-compat'

import BackgroundWaves from 'assets/img/publicSite/BackgroundWaves.png'
import {
  HEAVY_ROTATION,
  BEST_NEW_RELEASES,
  UNDER_THE_RADAR,
  REMIXABLES,
  MOST_LOVED,
  FEELING_LUCKY
} from 'common/store/smart-collection/smartCollections'
import { CollectionCard } from 'components/collection'
import PerspectiveCard, {
  TextInterior
} from 'components/perspective-card/PerspectiveCard'
import { UserCard } from 'components/user-card'
import { useIsUSDCEnabled } from 'hooks/useIsUSDCEnabled'
import useTabs from 'hooks/useTabs/useTabs'
import { smartCollectionIcons } from 'pages/collection-page/smartCollectionIcons'
import {
  LET_THEM_DJ,
  PREMIUM_TRACKS,
  TOP_ALBUMS,
  TRENDING_PLAYLISTS,
  TRENDING_UNDERGROUND,
  DOWNLOADS_AVAILABLE
} from 'pages/explore-page/collections'
import { explore } from 'services/explore'
import { BASE_URL, stripBaseUrl } from 'utils/route'

import { CollectionArtCard } from './CollectionArtCard'
import { FeaturedPlaylists } from './FeaturedPlaylists'
import UserArtCard from './UserArtCard'

export type ExplorePageProps = {
  title: string
  pageTitle: string
  description: string
}
export enum SavedPageTabs {
  ALL = 'All',
  PROFILES = 'Profiles',
  TRACKS = 'Tracks',
  ALBUMS = 'Albums',
  PLAYLISTS = 'Playlists'
}

const messages = {
  explore: 'Explore',
  description: 'Discover the hottest and trendiest tracks on Audius right now',
  searchPlaceholder: 'What do you want to listen to?',
  featuredPlaylists: 'Featured Playlists',
  remixContests: 'Remix Contests',
  artistSpotlight: 'Artist Spotlight',
  bestOfAudius: 'Best of Audius',
  viewAll: 'View All'
}

const tabHeaders = [
  {
    icon: <IconSearch />,
    text: SavedPageTabs.ALL,
    label: SavedPageTabs.ALL
  },
  {
    icon: <IconUser />,
    text: SavedPageTabs.PROFILES,
    label: SavedPageTabs.PROFILES
  },
  {
    icon: <IconNote />,
    text: SavedPageTabs.TRACKS,
    label: SavedPageTabs.TRACKS
  },
  {
    icon: <IconAlbum />,
    text: SavedPageTabs.ALBUMS,
    label: SavedPageTabs.ALBUMS
  },
  {
    icon: <IconPlaylists />,
    text: SavedPageTabs.PLAYLISTS,
    label: SavedPageTabs.PLAYLISTS
  }
]

export const justForYou = [
  PREMIUM_TRACKS,
  TRENDING_PLAYLISTS,
  TRENDING_UNDERGROUND,
  DOWNLOADS_AVAILABLE
]

const ExplorePage = ({ title, pageTitle, description }: ExplorePageProps) => {
  const { tabs, body } = useTabs({
    isMobile: false,
    tabs: tabHeaders,
    elements: tabHeaders.map((tab) => <Flex key={tab.label}>{tab.text}</Flex>)
  })
  const isUSDCPurchasesEnabled = useIsUSDCEnabled()
  const navigate = useNavigate()

  const justForYouTiles = justForYou.filter((tile) => {
    const isPremiumTracksTile =
      tile.variant === ExploreCollectionsVariant.DIRECT_LINK &&
      tile.title === PREMIUM_TRACKS.title
    return !isPremiumTracksTile || isUSDCPurchasesEnabled
  })
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
  const { data: featuredPlaylists } = useFeaturedPlaylists(
    { limit: 5 },
    { placeholderData: (prev: TQCollection[]) => prev }
  )
  const { data: featuredProfiles } = useFeaturedProfiles({ limit: 5 })

  return (
    <Flex justifyContent='center'>
      <Flex
        direction='column'
        p='3xl'
        gap='3xl'
        alignItems='flex-start'
        alignSelf='stretch'
        // w={1088}
      >
        <Paper
          alignItems='center'
          direction='column'
          mb='2xl'
          gap='xl'
          pv='xl'
          ph='unit14'
          css={{
            backgroundImage: `url(${BackgroundWaves})`
          }}
          borderRadius='l'
          alignSelf='stretch'
        >
          <Text variant='display' size='s' color='staticWhite'>
            {messages.explore}
          </Text>
          <Text variant='heading' size='s' color='staticWhite'>
            {messages.description}
          </Text>
          <Flex w={400}>
            <TextInput
              width={400}
              label={messages.searchPlaceholder}
              size={TextInputSize.SMALL}
              startIcon={IconSearch}
            />
          </Flex>
        </Paper>
        <Flex>{tabs}</Flex>
        <div>{body}</div>
        <Flex direction='column' gap='l'>
          <Flex
            gap='m'
            alignItems='center'
            alignSelf='stretch'
            justifyContent='space-between'
          >
            <Text variant='heading'>{messages.featuredPlaylists}</Text>
            <TextLink textVariant='title' size='m'>
              {messages.viewAll}
            </TextLink>
          </Flex>
          <Flex gap='l'>
            {featuredPlaylists?.map((playlist) => {
              return (
                <CollectionCard
                  key={playlist.playlist_id}
                  id={playlist.playlist_id}
                  size={'s'}
                />
              )
            })}
          </Flex>
        </Flex>
        <Flex>
          <Text variant='heading'>{messages.remixContests}</Text>
        </Flex>
        <Flex direction='column' gap='l'>
          <Flex
            gap='m'
            alignItems='center'
            alignSelf='stretch'
            justifyContent='space-between'
          >
            <Text variant='heading'>{messages.artistSpotlight}</Text>
            <TextLink textVariant='title' size='m'>
              {messages.viewAll}
            </TextLink>
          </Flex>
          <Flex gap='l' alignSelf='stretch'>
            {featuredProfiles?.map((featuredProfile: User, i: number) => {
              return (
                <UserCard
                  key={featuredProfile.user_id}
                  id={featuredProfile.user_id}
                  size='s'
                />
              )
            })}
          </Flex>
        </Flex>
        <Flex direction='column' gap='l'>
          <Text variant='heading'>{messages.bestOfAudius}</Text>
          <Flex wrap='wrap' gap='l' direction='row' alignItems='flex-start'>
            {justForYouTiles.map((i) => {
              const title =
                i.variant === CollectionVariant.SMART
                  ? i.playlist_name
                  : i.title
              const subtitle =
                i.variant === CollectionVariant.SMART
                  ? i.description
                  : i.subtitle
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
                  onClick={() => onClickCard(i.link)}
                  isIncentivized={!!i.incentivized}
                  sensitivity={i.cardSensitivity}
                >
                  <Flex w={504} h={168}>
                    <TextInterior title={title} subtitle={subtitle} />
                  </Flex>
                </PerspectiveCard>
              )
            })}
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}

export default ExplorePage
