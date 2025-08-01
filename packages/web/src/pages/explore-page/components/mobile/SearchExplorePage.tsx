import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ChangeEvent
} from 'react'

import { useExploreContent } from '@audius/common/api'
import { useFeatureFlag } from '@audius/common/hooks'
import { exploreMessages as messages } from '@audius/common/messages'
import { FeatureFlags } from '@audius/common/services'
import {
  Paper,
  Text,
  Flex,
  TextInput,
  TextInputSize,
  IconSearch,
  useTheme,
  useMedia,
  RadioGroup,
  SelectablePill
} from '@audius/harmony'
import { capitalize } from 'lodash'
import { useNavigate, useSearchParams } from 'react-router-dom-v5-compat'
import { useDebounce, usePrevious } from 'react-use'

import BackgroundWaves from 'assets/img/publicSite/imageSearchHeaderBackground@2x.webp'
import { CollectionCard } from 'components/collection'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import NavContext, { CenterPreset } from 'components/nav/mobile/NavContext'
import PerspectiveCard, {
  TextInterior
} from 'components/perspective-card/PerspectiveCard'
import { RemixContestCard } from 'components/remix-contest-card'
import { UserCard } from 'components/user-card'
import { useIsUSDCEnabled } from 'hooks/useIsUSDCEnabled'
import {
  DOWNLOADS_AVAILABLE,
  PREMIUM_TRACKS,
  TRENDING_PLAYLISTS,
  TRENDING_UNDERGROUND
} from 'pages/explore-page/collections'
import { RecentSearches } from 'pages/search-page/RecentSearches'
import { SearchCatalogTile } from 'pages/search-page/SearchCatalogTile'
import { SearchResults } from 'pages/search-page/SearchResults'
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
  ViewLayout
} from 'pages/search-page/types'
import { BASE_URL, stripBaseUrl } from 'utils/route'

import { ExploreSection } from '../desktop/ExploreSection'
import { QuickSearchGrid } from '../desktop/QuickSearchGrid'
import { TrendingPlaylists } from '../desktop/TrendingPlaylists'

import { MostSharedSection } from './MostSharedSection'
import { UndergroundTrendingSection } from './UndergroundTrendingSection'

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

const justForYou = [
  TRENDING_PLAYLISTS,
  TRENDING_UNDERGROUND,
  PREMIUM_TRACKS,
  DOWNLOADS_AVAILABLE
]
const DEBOUNCE_MS = 200

const ExplorePage = () => {
  const [categoryKey, setCategory] = useSearchCategory()
  const [searchParams, setSearchParams] = useSearchParams()
  const [inputValue, setInputValue] = useState(searchParams.get('query') || '')
  const [debouncedValue, setDebouncedValue] = useState(inputValue)
  const previousDebouncedValue = usePrevious(debouncedValue)
  const isUSDCPurchasesEnabled = useIsUSDCEnabled()
  const navigate = useNavigate()
  const showSearchResults = useShowSearchResults()
  const [tracksLayout] = useState<ViewLayout>('list')
  const searchBarRef = useRef<HTMLInputElement>(null)
  const { color, spacing } = useTheme()
  const { isLarge } = useMedia()

  const { isEnabled: isSearchExploreGoodiesEnabled } = useFeatureFlag(
    FeatureFlags.SEARCH_EXPLORE_GOODIES
  )

  const { data: exploreContent } = useExploreContent()

  const handleSearchTab = useCallback(
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
      setSearchParams(newParams)
    } else if (categoryKey === SearchTabs.ALL.toLowerCase()) {
      // clear filters when searching all
      const newParams = new URLSearchParams()
      if (debouncedValue) {
        newParams.set('query', debouncedValue)
      }
      setSearchParams(newParams)
    }
  }, [
    debouncedValue,
    setSearchParams,
    searchParams,
    previousDebouncedValue,
    categoryKey
  ])

  const justForYouTiles = justForYou.filter((tile) => {
    const isPremiumTracksTile = tile.title === PREMIUM_TRACKS.title
    return !isPremiumTracksTile || isUSDCPurchasesEnabled
  })

  const [, setBannerIsVisible] = useState(false)

  useEffect(() => {
    const img = new window.Image()
    img.src = BackgroundWaves
    img.onload = () => setBannerIsVisible(true)
  }, [])

  const { setLeft, setCenter, setRight } = useContext(NavContext)!
  const handleCategoryChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setCategory(value as CategoryKey)
    },
    [setCategory]
  )

  // Hide search header
  useEffect(() => {
    setRight(null)
    setCenter(CenterPreset.LOGO)
  }, [setLeft, setCenter, setRight])

  return (
    <MobilePageContainer
      title={messages.explore}
      containerClassName='search-explore-page'
    >
      <Flex direction='column' w='100%' style={{ overflow: 'hidden' }}>
        <Flex direction='column' ph='l' pt='l' backgroundColor='surface1'>
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
            css={{
              overflow: 'scroll',
              // Hide scrollbar for IE, Edge, and Firefox
              msOverflowStyle: 'none', // IE and Edge
              scrollbarWidth: 'none', // Firefox
              marginLeft: '-50vw',
              marginRight: '-50vw',
              paddingLeft: '50vw',
              padding: '16px 50vw'
            }}
          >
            {Object.entries(categories).map(([key, category]) => (
              <SelectablePill
                aria-label={`${key} search category`}
                icon={(category as Category).icon}
                key={key}
                label={capitalize(key)}
                name='searchCategory'
                size='large'
                type='radio'
                value={key}
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
          <Flex direction='column' mt='l' gap='2xl'>
            <QuickSearchGrid />
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

            {isSearchExploreGoodiesEnabled ? (
              <UndergroundTrendingSection />
            ) : null}

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
            </Flex>
            {isSearchExploreGoodiesEnabled ? (
              <Flex direction='column' mt='2xl' gap='l'>
                <TrendingPlaylists />
                <MostSharedSection />
              </Flex>
            ) : null}
            <Flex direction='column' ph='l' gap='l'>
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
                        gap: spacing.l, // or just gap: 'l' if supported
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
                      useOverlayBlendMode={tile.title !== PREMIUM_TRACKS.title}
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
        )}
      </Flex>
    </MobilePageContainer>
  )
}

export default ExplorePage
