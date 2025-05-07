import { useCallback, useEffect, useState } from 'react'

import {
  useExploreContent,
  useFeaturedPlaylists,
  useFeaturedProfiles
} from '@audius/common/api'
import { User } from '@audius/common/models'
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
  IconUser,
  TextLink,
  Divider
} from '@audius/harmony'
import { useNavigate, useSearchParams } from 'react-router-dom-v5-compat'
import { useDebounce, usePrevious } from 'react-use'

import BackgroundWaves from 'assets/img/publicSite/imageSearchHeaderBackground@2x.webp'
import { CollectionCard } from 'components/collection'
import PerspectiveCard, {
  TextInterior
} from 'components/perspective-card/PerspectiveCard'
import { RemixContestCard } from 'components/remix-contest-card'
import { UserCard } from 'components/user-card'
import { useIsUSDCEnabled } from 'hooks/useIsUSDCEnabled'
import useTabs from 'hooks/useTabs/useTabs'
import {
  PREMIUM_TRACKS,
  TRENDING_PLAYLISTS,
  TRENDING_UNDERGROUND,
  DOWNLOADS_AVAILABLE
} from 'pages/explore-page/collections'
import { RecentSearches } from 'pages/search-page/RecentSearches'
import { SearchCatalogTile } from 'pages/search-page/SearchCatalogTile'
import { filters } from 'pages/search-page/SearchFilters'
import { SearchResults } from 'pages/search-page/SearchResults'
import { SortMethodFilterButton } from 'pages/search-page/SortMethodFilterButton'
import { categories } from 'pages/search-page/categories'
import {
  useSearchCategory,
  useShowSearchResults
} from 'pages/search-page/hooks'
import { CategoryView } from 'pages/search-page/types'
import { BASE_URL, stripBaseUrl } from 'utils/route'

export type ExplorePageProps = {
  title: string
  pageTitle: string
  description: string
}
export enum SearchTabs {
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
  featuredRemixContests: 'Featured Remix Contests',
  artistSpotlight: 'Artist Spotlight',
  bestOfAudius: 'Best of Audius',
  viewAll: 'View All'
}

const tabHeaders = [
  {
    icon: <IconSearch />,
    text: SearchTabs.ALL,
    label: SearchTabs.ALL
  },
  {
    icon: <IconUser />,
    text: SearchTabs.PROFILES,
    label: SearchTabs.PROFILES
  },
  {
    icon: <IconNote />,
    text: SearchTabs.TRACKS,
    label: SearchTabs.TRACKS
  },
  {
    icon: <IconAlbum />,
    text: SearchTabs.ALBUMS,
    label: SearchTabs.ALBUMS
  },
  {
    icon: <IconPlaylists />,
    text: SearchTabs.PLAYLISTS,
    label: SearchTabs.PLAYLISTS
  }
]

const justForYou = [
  TRENDING_PLAYLISTS,
  TRENDING_UNDERGROUND,
  DOWNLOADS_AVAILABLE,
  PREMIUM_TRACKS
]
const FEATURED_LIMIT = 5
const DEBOUNCE_MS = 400

const ExplorePage = ({ title, pageTitle, description }: ExplorePageProps) => {
  const [categoryKey, setCategory] = useSearchCategory()
  const [searchParams, setSearchParams] = useSearchParams()
  const [inputValue, setInputValue] = useState(searchParams.get('query') || '')
  const [debouncedValue, setDebouncedValue] = useState(inputValue)
  const previousDebouncedValue = usePrevious(debouncedValue)
  const isUSDCPurchasesEnabled = useIsUSDCEnabled()
  const navigate = useNavigate()
  const showSearchResults = useShowSearchResults()

  const { data: featuredPlaylists } = useFeaturedPlaylists(
    { limit: FEATURED_LIMIT },
    { placeholderData: (prev: TQCollection[]) => prev }
  )
  const { data: featuredProfiles } = useFeaturedProfiles({
    limit: FEATURED_LIMIT
  })
  const { data: exploreContent, isLoading } = useExploreContent()
  const featuredRemixContests = exploreContent?.featuredRemixContests ?? []

  const handleTabClick = useCallback(
    (newTab: string) => {
      setCategory(newTab.toLowerCase() as CategoryView)
    },
    [setCategory]
  )

  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(event.target.value)
    },
    []
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

  useDebounce(
    () => {
      setDebouncedValue(inputValue)
    },
    DEBOUNCE_MS,
    [inputValue]
  )

  useEffect(() => {
    if (debouncedValue !== previousDebouncedValue) {
      const newParams = new URLSearchParams(searchParams)
      newParams.set('query', debouncedValue)
      setSearchParams(newParams)
    }
  }, [debouncedValue, setSearchParams, searchParams, previousDebouncedValue])

  const filterKeys: string[] = categories[categoryKey].filters
  const justForYouTiles = justForYou.filter((tile) => {
    const isPremiumTracksTile =
      tile.variant === ExploreCollectionsVariant.DIRECT_LINK &&
      tile.title === PREMIUM_TRACKS.title
    return !isPremiumTracksTile || isUSDCPurchasesEnabled
  })

  const { tabs } = useTabs({
    isMobile: false,
    tabs: tabHeaders,
    elements: tabHeaders.map((tab) => <Flex key={tab.label}>{tab.text}</Flex>),
    onTabClick: handleTabClick
  })

  return (
    <Flex justifyContent='center'>
      <Flex
        direction='column'
        pv='3xl'
        ph='unit15'
        gap='3xl'
        alignItems='stretch'
        w={1200}
      >
        {/* Header Section */}
        <Paper
          alignItems='center'
          direction='column'
          gap='xl'
          pv='xl'
          ph='unit14'
          css={{
            backgroundImage: `url(${BackgroundWaves})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundColor: 'lightgray'
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
              value={inputValue}
              size={TextInputSize.SMALL}
              startIcon={IconSearch}
              onChange={handleSearch}
            />
          </Flex>
        </Paper>

        {/* Tabs and Filters */}
        <Flex direction='column' gap='l'>
          <Flex alignSelf='flex-start'>{tabs}</Flex>
          <Divider orientation='horizontal' />
          {filterKeys.length ? (
            <Flex
              direction='row'
              justifyContent='space-between'
              alignItems='center'
            >
              <Flex direction='row' gap='s' mv='m'>
                {filterKeys.map((filterKey) => {
                  const FilterComponent =
                    filters[filterKey as keyof typeof filters]
                  return <FilterComponent key={filterKey} />
                })}
              </Flex>
              <SortMethodFilterButton />
            </Flex>
          ) : null}
        </Flex>

        {/* Content Section */}
        {!showSearchResults && categoryKey !== 'all' ? (
          <Flex direction='column' alignItems='center' gap={'xl'}>
            <SearchCatalogTile />
            <RecentSearches />
          </Flex>
        ) : inputValue || showSearchResults ? (
          <SearchResults />
        ) : (
          <>
            {/* Featured Playlists */}
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
              <Flex gap='l' justifyContent='space-between'>
                {featuredPlaylists?.map((playlist) => (
                  <CollectionCard
                    key={playlist.playlist_id}
                    id={playlist.playlist_id}
                    size={'s'}
                  />
                ))}
              </Flex>
            </Flex>
            <Flex>
              <Flex direction='column' gap='l'>
                <Text variant='heading'>{messages.featuredRemixContests}</Text>
                <Flex gap='l' justifyContent='space-between'>
                  {featuredRemixContests?.map((featuredRemixContest) => (
                    <RemixContestCard
                      key={featuredRemixContest}
                      id={featuredRemixContest}
                      size={'s'}
                    />
                  ))}
                </Flex>
              </Flex>
            </Flex>

            {/* Artist Spotlight */}
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
              <Flex gap='l' alignSelf='stretch' justifyContent='space-between'>
                {featuredProfiles?.map((featuredProfile: User) => (
                  <UserCard
                    key={featuredProfile.user_id}
                    id={featuredProfile.user_id}
                    size='s'
                  />
                ))}
              </Flex>
            </Flex>

            {/* Just For You */}
            <Flex direction='column' gap='l'>
              <Text variant='heading'>{messages.bestOfAudius}</Text>
              <Flex
                wrap='wrap'
                gap='l'
                direction='row'
                justifyContent='space-between'
              >
                {justForYouTiles.map((tile) => {
                  const Icon = tile.icon
                  return (
                    <PerspectiveCard
                      key={tile.title}
                      backgroundGradient={tile.gradient}
                      shadowColor={tile.shadow}
                      useOverlayBlendMode={
                        tile.variant !== ExploreCollectionsVariant.DIRECT_LINK
                      }
                      backgroundIcon={
                        Icon ? <Icon color='inverse' /> : undefined
                      }
                      onClick={() => onClickCard(tile.link)}
                      isIncentivized={!!tile.incentivized}
                      sensitivity={tile.cardSensitivity}
                    >
                      <Flex w={532} h={200}>
                        <TextInterior
                          title={tile.title}
                          subtitle={tile.subtitle}
                        />
                      </Flex>
                    </PerspectiveCard>
                  )
                })}
              </Flex>
            </Flex>
          </>
        )}
      </Flex>
    </Flex>
  )
}

export default ExplorePage
