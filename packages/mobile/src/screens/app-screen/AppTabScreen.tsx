import { useCallback, useContext, useEffect } from 'react'

import type {
  FavoriteType,
  TipSource,
  ID,
  SearchTrack,
  SearchPlaylist
} from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import type {
  NotificationType,
  RepostType,
  CreateChatModalState
} from '@audius/common/store'
import type { EventArg, NavigationState } from '@react-navigation/native'
import type { createNativeStackNavigator } from '@react-navigation/native-stack'

import { FilterButtonScreen } from '@audius/harmony-native'
import type { FilterButtonScreenParams } from '@audius/harmony-native'
import { useDrawer } from 'app/hooks/useDrawer'
import { setLastNavAction } from 'app/hooks/useNavigation'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { AiGeneratedTracksScreen } from 'app/screens/ai-generated-tracks-screen'
import { AppDrawerContext } from 'app/screens/app-drawer-screen'
import { AudioScreen } from 'app/screens/audio-screen'
import { ChatListScreen } from 'app/screens/chat-screen/ChatListScreen'
import { ChatScreen } from 'app/screens/chat-screen/ChatScreen'
import { ChatUserListScreen } from 'app/screens/chat-screen/ChatUserListScreen'
import { CollectionScreen } from 'app/screens/collection-screen/CollectionScreen'
import { EditProfileScreen } from 'app/screens/edit-profile-screen'
import { PayAndEarnScreen } from 'app/screens/pay-and-earn-screen'
import { ProfileScreen } from 'app/screens/profile-screen'
import {
  SearchResultsScreen,
  TagSearchScreen
} from 'app/screens/search-results-screen'
import { SearchScreen } from 'app/screens/search-screen'
import type { SearchParams } from 'app/screens/search-screen-v2'
import { SearchScreenStack } from 'app/screens/search-screen-v2'
import {
  AboutScreen,
  AccountSettingsScreen,
  AccountVerificationScreen,
  ListeningHistoryScreen,
  DownloadSettingsScreen,
  InboxSettingsScreen,
  CommentSettingsScreen,
  NotificationSettingsScreen,
  SettingsScreen
} from 'app/screens/settings-screen'
import { TrackScreen } from 'app/screens/track-screen'
import { TrackRemixesScreen } from 'app/screens/track-screen/TrackRemixesScreen'
import {
  FavoritedScreen,
  FollowersScreen,
  FollowingScreen,
  RepostsScreen,
  NotificationUsersScreen,
  MutualsScreen,
  RelatedArtistsScreen,
  TopSupportersScreen,
  SupportingUsersScreen
} from 'app/screens/user-list-screen'

import { useAppScreenOptions } from './useAppScreenOptions'

export type AppTabScreenParamList = {
  Track: {
    id?: ID
    searchTrack?: SearchTrack
    canBeUnlisted?: boolean
    handle?: string
    slug?: string
    showComments?: boolean
  }
  TrackRemixes: { id: ID } | { handle: string; slug: string }
  Profile: { handle: string; id?: ID } | { handle?: string; id: ID }
  Collection: {
    id?: ID
    slug?: string
    searchCollection?: SearchPlaylist
    collectionType?: 'playlist' | 'album'
    handle?: string
  }
  EditCollection: { id: ID }
  Favorited: { id: ID; favoriteType: FavoriteType }
  Reposts: { id: ID; repostType: RepostType }
  Followers: { userId: ID }
  Following: { userId: ID }
  Mutuals: { userId: ID }
  AiGeneratedTracks: { userId: ID }
  RelatedArtists: { userId: ID }
  Search: SearchParams
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
  SettingsScreen: undefined
  AboutScreen: undefined
  ListeningHistoryScreen: undefined
  AccountSettingsScreen: undefined
  AccountVerificationScreen: undefined
  ChangeEmail: undefined
  ChangePassword: undefined
  InboxSettingsScreen: undefined
  CommentSettingsScreen: undefined
  DownloadSettingsScreen: undefined
  NotificationSettingsScreen: undefined
  PayAndEarnScreen: undefined
  AudioScreen: undefined
  Upload: undefined
  FeatureFlagOverride: undefined
  CreateChatBlast: undefined
  EditTrack: { id: ID }
  WalletConnect: undefined
  ChatList: undefined
  ChatUserList:
    | {
        presetMessage?: string
        defaultUserList?: CreateChatModalState['defaultUserList']
      }
    | undefined
  Chat: {
    chatId: string
    presetMessage?: string
  }
  ChatBlastSelectContent: {
    valueName: string
    title: string
    searchLabel: string
    content: { label: string; value: string }[]
  }
  FilterButton: FilterButtonScreenParams
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
  const { drawerNavigation } = useContext(AppDrawerContext)
  const { isOpen: isNowPlayingDrawerOpen } = useDrawer('NowPlaying')
  const { isEnabled: isSearchV2Enabled } = useFeatureFlag(
    FeatureFlags.SEARCH_V2
  )

  const handleChangeState = useCallback(
    (event: NavigationStateEvent) => {
      const stackRoutes = event?.data?.state?.routes
      const isStackUnopened = stackRoutes.length === 1
      const isStackOpened = stackRoutes.length === 2

      if (isStackUnopened) {
        drawerNavigation?.setOptions({ swipeEnabled: true })
      }
      if (isStackOpened) {
        drawerNavigation?.setOptions({ swipeEnabled: false })
      }
    },
    [drawerNavigation]
  )

  /**
   * Reset lastNavAction on transitionEnd
   * Need to do this via screenListeners on the Navigator because listening
   * via navigation.addListener inside a screen does not always
   * catch events from other screens
   */
  const handleTransitionEnd = useCallback(() => {
    setLastNavAction(undefined)
  }, [])

  useEffect(() => {
    drawerNavigation?.setOptions({ swipeEnabled: !isNowPlayingDrawerOpen })
  }, [drawerNavigation, isNowPlayingDrawerOpen])

  return (
    <Stack.Navigator
      screenOptions={screenOptions}
      screenListeners={{
        state: handleChangeState,
        transitionEnd: handleTransitionEnd
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
        name='Profile'
        component={ProfileScreen}
        options={screenOptions}
      />
      {isSearchV2Enabled ? (
        <Stack.Screen
          name='Search'
          component={SearchScreenStack}
          options={{ ...screenOptions, headerShown: false }}
        />
      ) : (
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
      )}
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
          name='AiGeneratedTracks'
          component={AiGeneratedTracksScreen}
          options={screenOptions}
        />
        <Stack.Screen
          name='Mutuals'
          component={MutualsScreen}
          options={screenOptions}
        />
        <Stack.Screen
          name='RelatedArtists'
          component={RelatedArtistsScreen}
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
        name='TopSupporters'
        component={TopSupportersScreen}
        options={screenOptions}
      />
      <Stack.Screen
        name='SupportingUsers'
        component={SupportingUsersScreen}
        options={screenOptions}
      />
      <Stack.Screen name='PayAndEarnScreen' component={PayAndEarnScreen} />
      <Stack.Screen name='AudioScreen' component={AudioScreen} />

      <Stack.Group>
        <Stack.Screen name='EditProfile' component={EditProfileScreen} />
        <Stack.Screen name='SettingsScreen' component={SettingsScreen} />
        <Stack.Screen name='AboutScreen' component={AboutScreen} />
        <Stack.Screen
          name='ListeningHistoryScreen'
          component={ListeningHistoryScreen}
        />
        <Stack.Screen
          name='AccountSettingsScreen'
          component={AccountSettingsScreen}
        />
        <Stack.Screen
          name='InboxSettingsScreen'
          component={InboxSettingsScreen}
        />
        <Stack.Screen
          name='CommentSettingsScreen'
          component={CommentSettingsScreen}
        />
        <Stack.Screen
          name='DownloadSettingsScreen'
          component={DownloadSettingsScreen}
        />
        <Stack.Screen
          name='NotificationSettingsScreen'
          component={NotificationSettingsScreen}
        />
        <Stack.Screen
          name='AccountVerificationScreen'
          component={AccountVerificationScreen}
        />
      </Stack.Group>
      <Stack.Screen
        name='FilterButton'
        component={FilterButtonScreen}
        options={{ ...screenOptions, presentation: 'fullScreenModal' }}
      />
      <Stack.Group>
        <Stack.Screen name='ChatList' component={ChatListScreen} />
        <Stack.Screen name='ChatUserList' component={ChatUserListScreen} />
        <Stack.Screen
          name='Chat'
          component={ChatScreen}
          getId={({ params }) =>
            // @ts-ignore hard to correctly type navigation params (PAY-1141)
            params?.chatId
          }
          options={{ fullScreenGestureEnabled: false }}
        />
      </Stack.Group>
    </Stack.Navigator>
  )
}
