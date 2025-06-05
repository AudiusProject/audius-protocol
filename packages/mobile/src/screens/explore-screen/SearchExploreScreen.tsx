import { useCallback, useContext, useEffect, useState } from 'react'

import type { SearchCategory, SearchFiltersType } from '@audius/common/api'
import { useExploreContent, useUsers } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'
import { ExploreCollectionsVariant } from '@audius/common/store'
import { MOODS } from 'pages/search-page/moods'
import { ImageBackground, ScrollView, Image } from 'react-native'
import { useDebounce } from 'react-use'

import {
  Flex,
  IconSearch,
  Paper,
  Text,
  TextInput,
  TextInputSize,
  useTheme
} from '@audius/harmony-native'
import imageSearchHeaderBackground from 'app/assets/images/imageSearchHeaderBackground2x.png'
import { CollectionList } from 'app/components/collection-list'
import { Screen, ScreenContent } from 'app/components/core'
import { UserList } from 'app/components/user-list'
// import { useNavigation } from 'app/hooks/useNavigation'
import { useIsUSDCEnabled } from 'app/hooks/useIsUSDCEnabled'
import { useRoute } from 'app/hooks/useRoute'
import { makeStyles } from 'app/styles'
import { moodMap } from 'app/utils/moods'

import { AppDrawerContext } from '../app-drawer-screen'
import { AccountPictureHeader } from '../app-screen/AccountPictureHeader'
import { useAppScreenOptions } from '../app-screen/useAppScreenOptions'
import { SearchCategoriesAndFilters } from '../search-screen/SearchCategoriesAndFilters'
import { SearchResults } from '../search-screen/search-results/SearchResults'
import { SearchContext, useSearchQuery } from '../search-screen/searchState'

import {
  PREMIUM_TRACKS,
  TRENDING_PLAYLISTS,
  TRENDING_UNDERGROUND
} from './collections'
import { ColorTile } from './components/ColorTile'
import { ExploreCarousel } from './components/ExploreCarousel'
import { REMIXABLES } from './smartCollections'

const tiles = [
  TRENDING_PLAYLISTS,
  TRENDING_UNDERGROUND,

  PREMIUM_TRACKS,
  REMIXABLES
]

export const SearchExploreScreen = () => {
  const { spacing } = useTheme()

  const { params } = useRoute<'Search'>()
  const { drawerHelpers } = useContext(AppDrawerContext)
  const [query, setQuery] = useSearchQuery()

  const [, setQueryRoute] = useState(params?.query ?? '')

  const [searchInput, setSearchInput] = useState('')
  console.log('asdf query: ', searchInput)

  useDebounce(
    () => {
      console.log('asdf setting query ', searchInput)
      setQuery(searchInput)
    },
    400,
    [searchInput]
  )

  const handleOpenLeftNavDrawer = useCallback(() => {
    drawerHelpers?.openDrawer()
  }, [drawerHelpers])

  const isUSDCPurchasesEnabled = useIsUSDCEnabled()

  // Data fetching
  const { data: exploreContent } = useExploreContent()
  const { data: featuredArtists } = useUsers(exploreContent?.featuredProfiles)
  const { data: featuredLabels } = useUsers(exploreContent?.featuredLabels)

  // Derived data
  const filteredTiles = tiles.filter((tile) => {
    const isPremiumTracksTile =
      tile.variant === ExploreCollectionsVariant.DIRECT_LINK &&
      tile.title === PREMIUM_TRACKS.title
    return !isPremiumTracksTile || isUSDCPurchasesEnabled
  })

  const [autoFocus, setAutoFocus] = useState(params?.autoFocus ?? false)
  const [category, setCategory] = useState<SearchCategory>(
    params?.category ?? 'all'
  )
  const [filters, setFilters] = useState<SearchFiltersType>(
    params?.filters ?? {}
  )
  const [bpmType, setBpmType] = useState<'range' | 'target'>('range')

  useEffect(() => {
    setQuery(params?.query ?? '')
    setCategory(params?.category ?? 'all')
    setFilters(params?.filters ?? {})
    setAutoFocus(params?.autoFocus ?? false)
  }, [params])

  return (
    <SearchContext.Provider
      value={{
        autoFocus,
        setAutoFocus,
        query,
        setQuery,
        category,
        setCategory,
        filters,
        setFilters,
        bpmType,
        setBpmType,
        active: true
      }}
    >
      <Screen url='Explore' header={() => <></>}>
        <ScreenContent>
          <Flex>
            <ImageBackground source={imageSearchHeaderBackground}>
              <Flex pt='unit14' ph='l' pb='l' gap='l'>
                <Flex direction='row' gap='m'>
                  <AccountPictureHeader onPress={handleOpenLeftNavDrawer} />
                  <Text variant='heading' color='staticWhite'>
                    {messages.explore}
                  </Text>
                </Flex>
                <Text variant='title' color='staticWhite'>
                  {messages.description}
                </Text>
                <Flex>
                  <TextInput
                    label='Search'
                    // ref={searchBarRef}
                    placeholder={messages.searchPlaceholder}
                    // onChange={handleSearch}
                    // onClear={handleClearSearch}
                    size={TextInputSize.SMALL}
                    startIcon={IconSearch}
                    onChangeText={setSearchInput}
                  />
                </Flex>
              </Flex>
            </ImageBackground>
          </Flex>
          <SearchCategoriesAndFilters />

          <ScrollView>
            {searchInput ? (
              <SearchResults />
            ) : (
              <Flex direction='column' ph='l' pt='xl' pb='3xl' gap='2xl'>
                <Flex gap='l'>
                  <Text variant='title' size='l'>
                    {messages.featuredPlaylists}
                  </Text>
                  <CollectionList
                    horizontal
                    collectionIds={exploreContent?.featuredPlaylists || []}
                    carouselSpacing={spacing.l}
                  />
                </Flex>

                <Flex gap='l'>
                  <Text variant='title' size='l'>
                    {messages.artistSpotlight}
                  </Text>
                  <UserList
                    horizontal
                    profiles={featuredArtists}
                    carouselSpacing={spacing.l}
                  />
                </Flex>

                <Flex gap='l'>
                  <Text variant='title' size='l'>
                    {messages.labelSpotlight}
                  </Text>
                  <UserList
                    horizontal
                    profiles={featuredLabels}
                    carouselSpacing={spacing.l}
                  />
                </Flex>

                <Flex justifyContent='center' gap='l'>
                  <Text variant='title' size='l' textAlign='center'>
                    Explore By Mood
                  </Text>
                  <Flex
                    wrap='wrap'
                    direction='row'
                    justifyContent='center'
                    gap='s'
                  >
                    {Object.entries(MOODS)
                      .sort()
                      .map(([mood, moodInfo]) => (
                        <Paper
                          direction='row'
                          key={moodInfo.label}
                          pv='l'
                          ph='xl'
                          gap='m'
                          borderRadius='m'
                          border='default'
                          backgroundColor='white'
                        >
                          <Image
                            source={moodMap[moodInfo.label]}
                            style={{
                              height: spacing.unit5,
                              width: spacing.unit5
                            }}
                          />

                          <Text variant='title' size='s'>
                            {moodInfo.label}
                          </Text>
                        </Paper>
                      ))}
                  </Flex>
                </Flex>

                <Flex gap='l'>
                  <Text variant='title' size='l'>
                    {messages.bestOfAudius}
                  </Text>
                  <Flex gap='s'>
                    {filteredTiles.map((tile) => (
                      <ColorTile
                        style={{ flex: 1, flexBasis: '100%' }}
                        key={tile.title}
                        {...tile}
                      />
                    ))}
                  </Flex>
                </Flex>
              </Flex>
            )}
          </ScrollView>
        </ScreenContent>
      </Screen>
    </SearchContext.Provider>
  )
}
