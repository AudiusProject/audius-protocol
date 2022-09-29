import { useContext, useEffect } from 'react'

import type {
  ID,
  FavoriteType,
  TipSource,
  NotificationType,
  RepostType
} from '@audius/common'
import type { EventArg, NavigationState } from '@react-navigation/native'
import type { createNativeStackNavigator } from '@react-navigation/native-stack'

import { useDrawer } from 'app/hooks/useDrawer'
import type { ContextualParams } from 'app/hooks/useNavigation'
import { CollectionScreen } from 'app/screens/collection-screen/CollectionScreen'
import { ProfileScreen } from 'app/screens/profile-screen'
import {
  SearchResultsScreen,
  TagSearchScreen
} from 'app/screens/search-results-screen'
import { SearchScreen } from 'app/screens/search-screen'
import { TrackScreen } from 'app/screens/track-screen'
import {
  FavoritedScreen,
  FollowersScreen,
  FollowingScreen,
  RepostsScreen,
  NotificationUsersScreen,
  MutualsScreen,
  TopSupportersScreen,
  SupportingUsersScreen
} from 'app/screens/user-list-screen'
import type { SearchPlaylist, SearchTrack } from 'app/store/search/types'

import { EditPlaylistScreen } from '../edit-playlist-screen/EditPlaylistScreen'
import { NotificationsDrawerNavigationContext } from '../notifications-screen/NotificationsDrawerNavigationContext'
import { TipArtistModal } from '../tip-artist-screen'
import { TrackRemixesScreen } from '../track-screen/TrackRemixesScreen'

import { useAppScreenOptions } from './useAppScreenOptions'

export type AppTabScreenParamList = {
  Track: {
    id?: ID
    searchTrack?: SearchTrack
    canBeUnlisted?: boolean
    handle?: string
    slug?: string
  }
  TrackRemixes: { id: ID }
  Profile: { handle: string }
  Collection: {
    id?: ID
    collectionName?: string
    searchCollection?: SearchPlaylist
  }
  EditPlaylist: { id: ID }
  Favorited: { id: ID; favoriteType: FavoriteType }
  Reposts: { id: ID; repostType: RepostType }
  Followers: { userId: ID }
  Following: { userId: ID }
  Mutuals: { userId: ID }
  Search: undefined
  SearchResults: { query: string }
  SupportingUsers: { userId: ID }
  TagSearch: { query: string }
  TopSupporters: { userId: ID; source: TipSource }
  NotificationUsers: {
    id: string // uuid
    notificationType: NotificationType
    count: number
  }
  TipArtist: undefined
}

const forFade = ({ current }) => ({
  cardStyle: {
    opacity: current.progress
  }
})

type NavigationStateEvent = EventArg<
  'state',
  false,
  { state: NavigationState<AppTabScreenParamList> }
>

type AppTabScreenProps = {
  baseScreen: (
    Stack: ReturnType<typeof createNativeStackNavigator>
  ) => React.ReactNode
  Stack: ReturnType<typeof createNativeStackNavigator>
}

/**
 * This is the base tab screen that includes common screens
 * like track and profile
 */
export const AppTabScreen = ({ baseScreen, Stack }: AppTabScreenProps) => {
  const screenOptions = useAppScreenOptions()
  const { drawerNavigation } = useContext(NotificationsDrawerNavigationContext)
  const { isOpen: isNowPlayingDrawerOpen } = useDrawer('NowPlaying')

  useEffect(() => {
    drawerNavigation?.setOptions({ swipeEnabled: !isNowPlayingDrawerOpen })
  }, [drawerNavigation, isNowPlayingDrawerOpen])

  return (
    <Stack.Navigator
      screenOptions={screenOptions}
      screenListeners={{
        state: (e: NavigationStateEvent) => {
          const stackRoutes = e?.data?.state?.routes
          const isStackOpen = stackRoutes.length > 1
          if (isStackOpen) {
            const isFromNotifs =
              stackRoutes.length === 2 &&
              (stackRoutes[1].params as ContextualParams)?.fromNotifications

            // If coming from notifs allow swipe to open notifs drawer
            drawerNavigation?.setOptions({ swipeEnabled: !!isFromNotifs })
          } else {
            // If on the first tab (or the first stack screen isn't a tab navigator),
            // enable the drawer
            const isOnFirstTab = !e?.data?.state.routes[0].state?.index
            drawerNavigation?.setOptions({
              swipeEnabled: isOnFirstTab
            })
          }
        }
      }}
    >
      {baseScreen(Stack)}
      <Stack.Screen
        name='Track'
        component={TrackScreen}
        options={screenOptions}
      />
      <Stack.Screen
        name='TrackRemixes'
        component={TrackRemixesScreen}
        options={screenOptions}
      />
      <Stack.Screen
        name='Collection'
        component={CollectionScreen}
        options={screenOptions}
      />
      <Stack.Screen
        name='EditPlaylist'
        component={EditPlaylistScreen}
        options={screenOptions}
      />
      <Stack.Screen
        name='Profile'
        component={ProfileScreen}
        options={screenOptions}
      />
      <Stack.Group>
        <Stack.Screen
          name='Search'
          component={SearchScreen}
          options={(props) => ({
            ...screenOptions(props),
            cardStyleInterpolator: forFade
          })}
        />
        <Stack.Screen
          name='SearchResults'
          component={SearchResultsScreen}
          options={screenOptions}
        />
        <Stack.Screen
          name='TagSearch'
          component={TagSearchScreen}
          options={screenOptions}
        />
      </Stack.Group>
      <Stack.Group>
        <Stack.Screen
          name='Followers'
          component={FollowersScreen}
          options={screenOptions}
        />
        <Stack.Screen
          name='Following'
          component={FollowingScreen}
          options={screenOptions}
        />
        <Stack.Screen
          name='Favorited'
          component={FavoritedScreen}
          options={screenOptions}
        />
        <Stack.Screen
          name='Mutuals'
          component={MutualsScreen}
          options={screenOptions}
        />
        <Stack.Screen
          name='NotificationUsers'
          component={NotificationUsersScreen}
          options={screenOptions}
        />
      </Stack.Group>
      <Stack.Screen
        name='Reposts'
        component={RepostsScreen}
        options={screenOptions}
      />
      <Stack.Screen
        name='TipArtist'
        component={TipArtistModal}
        options={{
          headerShown: false,
          presentation: 'fullScreenModal'
        }}
      />
      <Stack.Screen
        name='TopSupporters'
        component={TopSupportersScreen}
        options={screenOptions}
      />
      <Stack.Screen
        name='SupportingUsers'
        component={SupportingUsersScreen}
        options={screenOptions}
      />
    </Stack.Navigator>
  )
}
