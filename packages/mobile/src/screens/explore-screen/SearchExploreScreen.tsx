import { useCallback, useContext } from 'react'

import {
  useCollections,
  useExploreContent,
  useFeaturedPlaylists,
  useFeaturedProfiles,
  useUsers
} from '@audius/common/api'
import { useFeatureFlag } from '@audius/common/hooks/useFeatureFlag'
import { FeatureFlags } from '@audius/common/services/remote-config/feature-flags'
import { ImageBackground, ScrollView, View } from 'react-native'

import {
  Flex,
  IconFeed,
  IconSearch,
  spacing,
  Text,
  TextInput,
  TextInputSize
} from '@audius/harmony-native'
import imageSearchHeaderBackground from 'app/assets/images/imageSearchHeaderBackground2x.png'
import { CollectionList } from 'app/components/collection-list'
import { Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import { OnlineOnly } from 'app/components/offline-placeholder/OnlineOnly'
import { SuggestedArtistsList } from 'app/components/suggested-follows/SuggestedArtistsList'
import { UserList } from 'app/components/user-list'
import { explore } from 'app/services/explore'
import { makeStyles } from 'app/styles'

import { AppDrawerContext } from '../app-drawer-screen'
import { AccountPictureHeader } from '../app-screen/AccountPictureHeader'
import { SearchCategoriesAndFilters } from '../search-screen/SearchCategoriesAndFilters'

import { FeaturedPlaylistsTab } from './tabs/FeaturedPlaylistsTab'

const messages = {
  header: 'Your Feed',
  exploreHeader: 'Explore',
  endOfFeed: "Looks like you've reached the end of your feed...",
  headerDescription: 'Discover new releases, fan favorites, and rising hits'
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  headerLeft: { marginLeft: spacing(-2) + 1, width: 40 },
  headerRight: {
    paddingVertical: spacing(2),
    paddingLeft: spacing(2)
  },
  title: {
    fontSize: 18,
    fontFamily: typography.fontByWeight.heavy,
    color: palette.neutralLight5,
    textTransform: 'uppercase'
  },
  audiusLogo: {
    height: 24,
    width: 93,
    marginRight: 10
  },
  exploreCarousel: {
    marginHorizontal: spacing(-8)
    // paddingLeft: spacing(4)
  }
}))

export const SearchExploreScreen = () => {
  const styles = useStyles()

  const { drawerHelpers } = useContext(AppDrawerContext)

  const handleOpenLeftNavDrawer = useCallback(() => {
    drawerHelpers?.openDrawer()
  }, [drawerHelpers])

  const { isEnabled: isSearchExploreEnabled } = useFeatureFlag(
    FeatureFlags.SEARCH_EXPLORE
  )
  const { data: featuredProfiles = [] } = useFeaturedProfiles()
  const { data: exploreContent, isPending } = useExploreContent()

  const { data: featuredPlaylists } = useCollections(
    exploreContent?.featuredPlaylists
  )

  const { data: featuredArtists } = useUsers(exploreContent?.featuredProfiles)

  const { data: featuredLabels } = useUsers(exploreContent?.featuredLabels)
  console.log('asdf featuredPlaylists: ', featuredPlaylists)
  return (
    <Screen url='Feed' header={() => {}}>
      <ScreenContent>
        <Flex>
          {/* <Flex h={300}></Flex> */}
          <ImageBackground source={imageSearchHeaderBackground}>
            <Flex
              pt={56}
              ph={16}
              pb={16}
              gap='l'
              // backgroundColor='blue'
            >
              <Flex direction='row' gap='m'>
                <AccountPictureHeader onPress={handleOpenLeftNavDrawer} />
                <Text variant='heading' color='staticWhite'>
                  {messages.exploreHeader}
                </Text>
              </Flex>
              <Text variant='title' color='staticWhite'>
                {messages.headerDescription}
              </Text>
              <Flex>
                <TextInput
                  label={'fdsa'}
                  size={TextInputSize.SMALL}
                  startIcon={IconSearch}
                />
              </Flex>
            </Flex>
          </ImageBackground>
        </Flex>
        <SearchCategoriesAndFilters />

        <ScrollView>
          <Flex direction='column' ph='l' pt='xl' gap='l'>
            <Text variant='title' size='l'>
              Featured Playlists
            </Text>
            <Flex style={styles.exploreCarousel}>
              <CollectionList
                isLoading={false}
                ListHeaderComponent={null}
                collectionIds={exploreContent?.featuredPlaylists || []}
                contentContainerStyle={{
                  paddingHorizontal: 16
                }}
              />
            </Flex>
            <Text variant='title' size='l'>
              Artist Spotlight
            </Text>
            <UserList
              isLoading={false}
              ListHeaderComponent={null}
              profiles={featuredArtists}
            />
            <Text variant='title' size='l'>
              Label Spotlight
            </Text>
            <UserList
              isLoading={false}
              ListHeaderComponent={null}
              profiles={featuredLabels}
            />
          </Flex>
        </ScrollView>
      </ScreenContent>
    </Screen>
  )
}
