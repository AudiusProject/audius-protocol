import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ChangeEvent
} from 'react'

import { useExploreContent } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'
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
  Divider,
  FilterButton,
  useTheme,
  useMedia,
  RadioGroup,
  SelectablePill
} from '@audius/harmony'
import { capitalize } from 'lodash'
import { useNavigate, useSearchParams } from 'react-router-dom-v5-compat'
import { useDebounce, useEffectOnce, usePrevious } from 'react-use'

import { useHistoryContext } from 'app/HistoryProvider'
import BackgroundWaves from 'assets/img/publicSite/imageSearchHeaderBackground@2x.webp'
import { CollectionCard } from 'components/collection'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import NavContext from 'components/nav/mobile/NavContext'
import PerspectiveCard, {
  TextInterior
} from 'components/perspective-card/PerspectiveCard'
import { RemixContestCard } from 'components/remix-contest-card'
import SearchBar from 'components/search-bar/SearchBar'
import { UserCard } from 'components/user-card'
import { useIsMobile } from 'hooks/useIsMobile'
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
import { MOODS } from 'pages/search-page/moods'
import {
  Category,
  CategoryKey,
  CategoryView,
  ViewLayout,
  viewLayoutOptions
} from 'pages/search-page/types'
import { BASE_URL, stripBaseUrl } from 'utils/route'

import { ExploreSection } from '../desktop/ExploreSection'

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
  PREMIUM_TRACKS,
  DOWNLOADS_AVAILABLE
]
const DEBOUNCE_MS = 200
const MIN_WIDTH = 840
const NORMAL_WIDTH = 1200

const ExplorePage = ({ title, pageTitle, description }: ExplorePageProps) => {
  const [categoryKey, setCategory] = useSearchCategory()
  const [searchParams, setSearchParams] = useSearchParams()
  const [inputValue, setInputValue] = useState(searchParams.get('query') || '')
  const [debouncedValue, setDebouncedValue] = useState(inputValue)
  const previousDebouncedValue = usePrevious(debouncedValue)
  const isUSDCPurchasesEnabled = useIsUSDCEnabled()
  const navigate = useNavigate()
  const showSearchResults = useShowSearchResults()
  const [tracksLayout, setTracksLayout] = useState<ViewLayout>('list')
  const searchBarRef = useRef<HTMLInputElement>(null)
  const { color, motion } = useTheme()
  const { isLarge } = useMedia()
  const isMobile = useIsMobile()

  const { data: exploreContent } = useExploreContent()

  const handleSearchTab = useCallback(
    (newTab: string) => {
      setCategory(newTab.toLowerCase() as CategoryView)
    },
    [setCategory]
  )

  useEffectOnce(() => {
    if (inputValue && searchBarRef.current) {
      searchBarRef.current.focus()
    }
  })

  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(event.target.value)
    },
    []
  )

  const handleClearSearch = useCallback(() => {
    setInputValue('')
  }, [])

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
      if (debouncedValue) {
        newParams.set('query', debouncedValue)
      } else {
        newParams.delete('query')
      }
      setSearchParams(newParams, { replace: true })
    } else if (categoryKey === SearchTabs.ALL.toLowerCase()) {
      // clear filters when searching all
      const newParams = new URLSearchParams()
      if (debouncedValue) {
        newParams.set('query', debouncedValue)
      }
      setSearchParams(newParams, { replace: true })
    }
  }, [
    debouncedValue,
    setSearchParams,
    searchParams,
    previousDebouncedValue,
    categoryKey
  ])

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
    onTabClick: handleSearchTab,
    selectedTabLabel: capitalize(categoryKey)
  })
  const [bannerIsVisible, setBannerIsVisible] = useState(false)

  useEffect(() => {
    const img = new window.Image()
    img.src = BackgroundWaves
    img.onload = () => setBannerIsVisible(true)
  }, [])

  const [isSearching, setIsSearching] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const { history } = useHistoryContext()
  const { setLeft, setCenter, setRight } = useContext(NavContext)!
  const handleCategoryChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setCategory(value as CategoryKey)
    },
    [setCategory]
  )

  const beginSearch = useCallback(() => {
    // setStackReset(true)
    // setImmediate(() => search(searchValue))
  }, [])

  const handleOpenSearch = useCallback(() => {
    history.push(`/search`)
  }, [history])

  const onCloseSearch = () => {
    setIsSearching(false)
    setSearchValue('')
  }

  // Hide navbar completely
  useEffect(() => {
    // setLeft(null)
    // setCenter(null)
    setRight(null)
  }, [setLeft, setCenter, setRight])

  return (
    <MobilePageContainer
      title={messages.explore}
      containerClassName='search-explore-page'
    >
      <Flex direction='column' w='100%' style={{ overflow: 'hidden' }}>
        <Flex direction='column' gap='l' p='l' backgroundColor='surface1'>
          <TextInput
            ref={searchBarRef}
            label={messages.searchPlaceholder}
            value={inputValue}
            startIcon={IconSearch}
            size={TextInputSize.SMALL}
            onChange={handleSearch}
            onClear={handleClearSearch}
          />
          <RadioGroup
            direction='row'
            gap='s'
            aria-label={'Select search category'}
            name='searchcategory'
            value={categoryKey}
            onChange={handleCategoryChange}
            style={{
              overflow: 'scroll',
              // Hide scrollbar for IE, Edge, and Firefox
              msOverflowStyle: 'none', // IE and Edge
              scrollbarWidth: 'none' // Firefox
            }}
          >
            {Object.entries(categories).map(([key, category]) => (
              <SelectablePill
                aria-label={`${key} search category`}
                icon={(category as Category).icon}
                key={key}
                label={capitalize(key)}
                size='large'
                type='radio'
                value={key}
                checked={key === categoryKey}
              />
            ))}
          </RadioGroup>
        </Flex>
        {!showSearchResults && categoryKey !== 'all' ? (
          <Flex direction='column' alignItems='center' gap={'xl'}>
            <SearchCatalogTile />
            <RecentSearches />
          </Flex>
        ) : inputValue || showSearchResults ? (
          <SearchResults
            tracksLayout={tracksLayout}
            handleSearchTab={handleSearchTab}
          />
        ) : (
          <Flex direction='column' mt='l'>
            <ExploreSection
              title={messages.featuredPlaylists}
              data={exploreContent?.featuredPlaylists}
              Card={CollectionCard}
            />
            <ExploreSection
              title={messages.featuredRemixContests}
              data={exploreContent?.featuredRemixContests}
              Card={RemixContestCard}
            />

            <ExploreSection
              title={messages.artistSpotlight}
              data={exploreContent?.featuredProfiles}
              Card={UserCard}
            />

            <ExploreSection
              title={messages.labelSpotlight}
              data={exploreContent?.featuredLabels}
              Card={UserCard}
            />
            <Flex direction='column' ph='l' gap='2xl'>
              <Flex direction='column' gap='l' alignItems='center'>
                <Text variant='title' size='l'>
                  {messages.exploreByMood}
                </Text>
                <Flex
                  gap='m'
                  justifyContent='center'
                  alignItems='flex-start'
                  wrap='wrap'
                >
                  {Object.entries(MOODS)
                    .sort()
                    .map(([mood, moodInfo]) => (
                      <Paper
                        key={mood}
                        pv='l'
                        ph='xl'
                        gap='m'
                        borderRadius='m'
                        border='default'
                        backgroundColor='white'
                        onClick={() => {
                          navigate(`/search/tracks?mood=${mood}`)
                        }}
                        css={{
                          ':hover': {
                            background: color.neutral.n25,
                            border: `1px solid ${color.neutral.n150}`
                          }
                        }}
                      >
                        {moodInfo.icon}
                        <Text variant='title' size='s'>
                          {moodInfo.label}
                        </Text>
                      </Paper>
                    ))}
                </Flex>
              </Flex>
              <Flex direction='column' gap='l'>
                <Text variant='title' size='l'>
                  {messages.bestOfAudius}
                </Text>
                <Flex
                  wrap='wrap'
                  gap='l'
                  direction={isLarge ? 'column' : 'row'}
                  justifyContent='space-between'
                  css={
                    !isLarge
                      ? {
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gridTemplateRows: '1fr 1fr',
                          gap: 'var(--harmony-spacing-l)', // or just gap: 'l' if supported
                          width: '100%'
                        }
                      : undefined
                  }
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
                          Icon ? (
                            <Icon height={180} width={180} color='inverse' />
                          ) : undefined
                        }
                        onClick={() => onClickCard(tile.link)}
                        isIncentivized={!!tile.incentivized}
                        sensitivity={tile.cardSensitivity}
                      >
                        <Flex w={'100%'} h={200}>
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
            </Flex>
          </Flex>
        )}
      </Flex>
    </MobilePageContainer>
  )
}

export default ExplorePage
