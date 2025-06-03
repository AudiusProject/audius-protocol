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
import { ScrollView } from 'react-native'

import { Flex, IconFeed, Text, TextInput } from '@audius/harmony-native'
import { CollectionList } from 'app/components/collection-list'
import { Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import { OnlineOnly } from 'app/components/offline-placeholder/OnlineOnly'
import { SuggestedArtistsList } from 'app/components/suggested-follows/SuggestedArtistsList'
import { UserList } from 'app/components/user-list'
import { explore } from 'app/services/explore'

import { AppDrawerContext } from '../app-drawer-screen'
import { AccountPictureHeader } from '../app-screen/AccountPictureHeader'

import { FeaturedPlaylistsTab } from './tabs/FeaturedPlaylistsTab'

const messages = {
  header: 'Your Feed',
  endOfFeed: "Looks like you've reached the end of your feed..."
}

export const SearchExploreScreen = () => {
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
    <Screen url='Feed' header={() => null}>
      <ScreenContent>
        <Flex>
          <Flex backgroundColor='red' h={300}></Flex>
          <AccountPictureHeader onPress={handleOpenLeftNavDrawer} />

          <TextInput label={'fdsa'} />
        </Flex>
        <ScrollView>
          <Flex direction='column'>
            <Text>Featured Playlists</Text>

            <CollectionList
              isLoading={false}
              ListHeaderComponent={null}
              collectionIds={exploreContent?.featuredPlaylists || []}
            />
            <Text>Artist Spotlight</Text>
            <UserList
              isLoading={false}
              ListHeaderComponent={null}
              profiles={featuredArtists}
            />
            <Text>Label Spotlight</Text>
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
