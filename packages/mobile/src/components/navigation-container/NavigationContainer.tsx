import { ReactNode, useContext } from 'react'

import {
  LinkingOptions,
  NavigationContainer as RNNavigationContainer
} from '@react-navigation/native'

import { RootScreenParamList } from 'app/screens/root-screen/RootScreen'

import { ThemeContext } from '../theme/ThemeContext'

import { navigationThemes } from './navigationThemes'

type Props = {
  children: ReactNode
}

const linking: LinkingOptions<RootScreenParamList> = {
  prefixes: ['https://audius.co'],
  // configuration for matching screens with paths
  config: {
    screens: {
      App: {
        initialRouteName: 'feed',
        screens: {
          feed: {
            screens: {
              FeedStack: 'feed',
              Track: '*/*',
              Profile: '*'
            }
          },
          trending: {
            screens: {
              TrendingStack: {
                screens: {
                  ThisWeek: 'trending/thisWeek',
                  ThisMonth: 'trending/thisMonth',
                  ThisYear: 'trending/thisYear'
                }
              }
            }
          },
          explore: {
            screens: {
              ExploreStack: {
                screens: {
                  forYou: 'explore/forYou',
                  moods: 'explore/moods',
                  playlists: 'explore/playlists',
                  artists: 'explore/artists'
                }
              }
            }
          },
          favorites: {
            screens: {
              FavoritesStack: {
                screens: {
                  tracks: 'favorites/tracks',
                  albums: 'favorites/albums',
                  playlists: 'favorites/playlists'
                }
              }
            }
          },
          profile: {
            screens: {
              ProfileStack: {
                screens: {
                  Tracks: '*/tracks',
                  Albums: '*/albums',
                  Playlists: '*/playlists',
                  Reposts: '*/reposts',
                  Collectibles: '*/collectibles/*'
                }
              }
            }
          }
        }
      }
    }
  }
}

/**
 * NavigationContainer contains the react-navigation context
 * and configures linking
 */
const NavigationContainer = ({ children }: Props) => {
  const { theme, isSystemDarkMode } = useContext(ThemeContext)

  const navigationTheme =
    theme === 'auto' ? (isSystemDarkMode ? 'dark' : 'default') : theme

  return (
    <RNNavigationContainer
      linking={linking}
      theme={navigationThemes[navigationTheme]}
    >
      {children}
    </RNNavigationContainer>
  )
}

export default NavigationContainer
