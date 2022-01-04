import React, { ReactNode } from 'react'

import {
  LinkingOptions,
  NavigationContainer as RNNavigationContainer
} from '@react-navigation/native'

import { AppStackParamList } from 'app/components/app-navigator/types'

type Props = {
  children: ReactNode
}

const linking: LinkingOptions<AppStackParamList> = {
  prefixes: ['https://audius.co'],
  // configuration for matching screens with paths
  config: {
    screens: {
      main: {
        initialRouteName: 'feed',
        screens: {
          feed: {
            screens: {
              'feed-stack': 'feed',
              track: '*/*',
              profile: '*'
            }
          },
          trending: {
            screens: {
              'trending-stack': {
                screens: {
                  thisWeek: 'trending/thisWeek',
                  thisMonth: 'trending/thisMonth',
                  thisYear: 'trending/thisYear'
                }
              }
            }
          },
          explore: {
            screens: {
              'explore-stack': {
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
              'favorites-stack': {
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
              'profile-stack': {
                screens: {
                  // tracks: '*',
                  tracks: '*/tracks',
                  albums: '*/albums',
                  playlists: '*/playlists',
                  reposts: '*/reposts',
                  collectibles: '*/collectibles/*'
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
  return (
    <RNNavigationContainer linking={linking}>{children}</RNNavigationContainer>
  )
}

export default NavigationContainer
