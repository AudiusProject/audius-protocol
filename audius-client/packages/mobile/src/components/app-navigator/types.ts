import { NavigatorScreenParams } from '@react-navigation/native'
import { ID } from 'audius-client/src/common/models/Identifiers'

export type BaseStackParamList = {
  track: { id: ID }
  profile: { id: ID }
}

export type FeedStackParamList = BaseStackParamList & {
  feed: undefined
}

export type BottomTabsParamList = {
  feed: NavigatorScreenParams<FeedStackParamList>
  trending: undefined
  explore: undefined
  favorites: undefined
  profile: undefined
}

export type AppStackParamList = {
  signOn: undefined
  main: NavigatorScreenParams<BottomTabsParamList>
}
