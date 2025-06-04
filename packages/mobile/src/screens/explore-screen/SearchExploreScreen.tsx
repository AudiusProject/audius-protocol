import { useCallback, useContext } from 'react'

import { useExploreContent, useUsers } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'
import { ExploreCollectionsVariant } from '@audius/common/store'
import { MOODS } from 'pages/search-page/moods'
import { ImageBackground, ScrollView, Image } from 'react-native'

import {
  Flex,
  IconSearch,
  Paper,
  Text,
  TextInput,
  TextInputSize
} from '@audius/harmony-native'
import imageSearchHeaderBackground from 'app/assets/images/imageSearchHeaderBackground2x.png'
import { CollectionList } from 'app/components/collection-list'
import { Screen, ScreenContent } from 'app/components/core'
import { UserList } from 'app/components/user-list'
// import { useNavigation } from 'app/hooks/useNavigation'
import { useIsUSDCEnabled } from 'app/hooks/useIsUSDCEnabled'
import { makeStyles } from 'app/styles'
import { moodMap } from 'app/utils/moods'

import { AppDrawerContext } from '../app-drawer-screen'
import { AccountPictureHeader } from '../app-screen/AccountPictureHeader'
import { SearchCategoriesAndFilters } from '../search-screen/SearchCategoriesAndFilters'

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

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  emoji: {
    height: 20,
    width: 20
  },
  tile: {
    flex: 1,
    flexBasis: '100%'
  }
}))

export const SearchExploreScreen = () => {
  const styles = useStyles()

  const { drawerHelpers } = useContext(AppDrawerContext)

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

  return (
    <Screen url='Feed' header={() => <></>}>
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
                />
              </Flex>
            </Flex>
          </ImageBackground>
        </Flex>
        <SearchCategoriesAndFilters />

        <ScrollView>
          <Flex direction='column' ph='l' pt='xl' pb='3xl' gap='2xl'>
            <ExploreCarousel
              title={messages.featuredPlaylists}
              list={
                <CollectionList
                  collectionIds={exploreContent?.featuredPlaylists || []}
                />
              }
            />

            <ExploreCarousel
              title={messages.artistSpotlight}
              list={<UserList profiles={featuredArtists} />}
            />

            <ExploreCarousel
              title={messages.labelSpotlight}
              list={<UserList profiles={featuredLabels} />}
            />

            <Flex justifyContent='center' gap='l'>
              <Text variant='title' size='l' textAlign='center'>
                Explore By Mood
              </Text>
              <Flex wrap='wrap' direction='row' justifyContent='center' gap='s'>
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
                        style={styles.emoji}
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
                {filteredTiles.map((tile, idx) => (
                  <ColorTile style={[styles.tile]} key={tile.title} {...tile} />
                ))}
              </Flex>
            </Flex>
          </Flex>
        </ScrollView>
      </ScreenContent>
    </Screen>
  )
}
