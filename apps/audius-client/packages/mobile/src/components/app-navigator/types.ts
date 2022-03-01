import { NavigatorScreenParams } from '@react-navigation/native'
import { ID } from 'audius-client/src/common/models/Identifiers'

export type BaseStackParamList = {
  Track: { id: ID }
  Profile: { handle: string }
}

export type FeedStackParamList = BaseStackParamList & {
  FeedStack: undefined
}

export type TrendingStackParamList = BaseStackParamList & {
  TrendingStack: undefined
}

export type ExploreStackParamList = BaseStackParamList & {
  ExploreStack: undefined
}

export type FavoritesStackParamList = BaseStackParamList & {
  FavoritesStack: undefined
}

export type ProfileStackParamList = BaseStackParamList & {
  ProfileStack: undefined
  EditProfile: undefined
  SettingsScreen: undefined
  AboutScreen: undefined
  AccountSettingsScreen: undefined
  NotificationSettingsScreen: undefined
  AudioScreen: undefined
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
