import { SearchExploreScreen } from '../explore-screen/SearchExploreScreen'
import { TrendingPlaylistsScreen } from '../explore-screen/tabs/ForYouTab/TrendingPlaylistsScreen'
import { TrendingUndergroundScreen } from '../explore-screen/tabs/ForYouTab/TrendingUndergroundScreen'

import type { AppTabScreenParamList } from './AppTabScreen'
import { createAppTabScreenStack } from './createAppTabScreenStack'

export type ExploreTabScreenParamList = AppTabScreenParamList & {
  SearchExplore: {
    autoFocus?: boolean
    query?: string
    category?: string
    filters?: Record<string, any>
  }
  TrendingPlaylists: undefined
  TrendingUnderground: undefined
}

export const ExploreTabScreen =
  createAppTabScreenStack<ExploreTabScreenParamList>((Stack) => {
    return (
      <>
        <Stack.Screen name='SearchExplore' component={SearchExploreScreen} />
        <Stack.Screen
          name='TrendingPlaylists'
          component={TrendingPlaylistsScreen}
        />
        <Stack.Screen
          name='TrendingUnderground'
          component={TrendingUndergroundScreen}
        />
      </>
    )
  })
