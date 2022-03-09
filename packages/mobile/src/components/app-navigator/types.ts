import { NavigatorScreenParams } from '@react-navigation/native'
import { FavoriteType } from 'audius-client/src/common/models/Favorite'
import { ID } from 'audius-client/src/common/models/Identifiers'
import { RepostType } from 'audius-client/src/common/store/user-list/reposts/types'

export type BaseStackParamList = {
  Track: { id: ID }
  Profile: { handle: string }
  Collection: { id: ID }
  Favorited: { id: ID; favoriteType: FavoriteType }
  Reposts: { id: ID; repostType: RepostType }
}

export type FeedStackParamList = BaseStackParamList & {
  FeedStack: undefined
}

export type TrendingStackParamList = BaseStackParamList & {
  TrendingStack: undefined
}

export type ExploreStackParamList = BaseStackParamList & {
  ExploreStack: undefined
  TrendingUnderground: undefined
  UnderTheRadar: undefined
}

export type FavoritesStackParamList = BaseStackParamList & {
  FavoritesStack: undefined
}

export type ProfileStackParamList = BaseStackParamList & {
  ProfileStack: undefined
  EditProfile: undefined
  SettingsScreen: undefined
  AboutScreen: undefined
  ListeningHistoryScreen: undefined
  AccountSettingsScreen: undefined
  NotificationSettingsScreen: undefined
  AudioScreen: undefined
  Followers: { userId: ID }
  Following: { userId: ID }
}

export type SearchParamList = BaseStackParamList & {
  Search: undefined
  SearchResults: { query: string }
}

export type MainParamList = {
  feed: NavigatorScreenParams<FeedStackParamList>
  trending: NavigatorScreenParams<TrendingStackParamList>
  explore: NavigatorScreenParams<ExploreStackParamList>
  favorites: NavigatorScreenParams<FavoritesStackParamList>
  profile: NavigatorScreenParams<ProfileStackParamList>
}

export type AppStackParamList = {
  signOn: undefined
  main: NavigatorScreenParams<MainParamList>
}
