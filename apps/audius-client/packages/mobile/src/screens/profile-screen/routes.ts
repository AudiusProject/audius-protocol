import type { RouteProp } from '@react-navigation/native'

type ProfileTabParamList = {
  Reposts: { lazy: boolean }
  Albums: {}
  Playlists: {}
  Collectibles: {}
}

export type ProfileTabRoutes<RouteName extends keyof ProfileTabParamList> =
  RouteProp<ProfileTabParamList, RouteName>
