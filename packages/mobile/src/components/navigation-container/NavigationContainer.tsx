import type { ReactNode } from 'react'
import { useRef } from 'react'

import { accountSelectors } from '@audius/common'
import { decodeHashId } from '@audius/common/utils'
import type {
  LinkingOptions,
  NavigationState,
  PartialState
} from '@react-navigation/native'
import {
  getStateFromPath,
  NavigationContainer as RNNavigationContainer,
  createNavigationContainerRef
} from '@react-navigation/native'
import queryString from 'query-string'
import { useSelector } from 'react-redux'

import { AppTabNavigationProvider } from 'app/screens/app-screen'
import { screen } from 'app/services/analytics'
import { getPrimaryRoute } from 'app/utils/navigation'
import { useThemeVariant } from 'app/utils/theme'

import { navigationThemes } from './navigationThemes'
const { getAccountUser } = accountSelectors

type NavigationContainerProps = {
  children: ReactNode
}

export const navigationRef = createNavigationContainerRef()

const createAppTabState = (
  state: PartialState<NavigationState>
): PartialState<NavigationState> => ({
  routes: [
    {
      name: 'HomeStack',
      state: {
        routes: [
          {
            name: 'App',
            state: {
              routes: [
                {
                  name: 'AppTabs',
                  state
                }
              ]
            }
          }
        ]
      }
    }
  ]
})

const createFeedStackState = (route): PartialState<NavigationState> =>
  createAppTabState({
    routes: [
      {
        name: 'feed',
        state: {
          index: 1,
          routes: [
            {
              name: 'Feed'
            },
            route
          ]
        }
      }
    ]
  })

/**
 * NavigationContainer contains the react-navigation context
 * and configures linking
 */
const NavigationContainer = (props: NavigationContainerProps) => {
  const { children } = props
  const theme = useThemeVariant()
  const account = useSelector(getAccountUser)

  const routeNameRef = useRef<string>()

  const linking: LinkingOptions<{}> = {
    prefixes: [
      'audius://',
      'https://audius.co',
      'http://audius.co',
      'https://redirect.audius.co',
      'http://redirect.audius.co',
      'audius-staging://',
      'https://staging.audius.co',
      'http://staging.audius.co',
      'https://redirect.staging.audius.co',
      'http://redirect.staging.audius.co'
    ],
    // configuration for matching screens with paths
    config: {
      screens: {
        HomeStack: {
          screens: {
            App: {
              screens: {
                AppTabs: {
                  screens: {
                    feed: {
                      initialRouteName: 'Feed',
                      screens: {
                        Feed: 'feed',
                        Collection: ':handle/collection/:slug',
                        TrackRemixes: ':handle/:slug/remixes',
                        Track: 'track/:handle/:slug',
                        Profile: {
                          path: ':handle',
                          screens: {
                            Tracks: 'tracks',
                            Albums: 'albums',
                            Playlists: 'playlists',
                            Reposts: 'reposts',
                            Collectibles: 'collectibles'
                          }
                        } as any // Nested navigator typing with own params is broken, see: https://github.com/react-navigation/react-navigation/issues/9897
                      }
                    },
                    trending: {
                      initialRouteName: 'Trending',
                      screens: {
                        Trending: 'trending'
                      }
                    },
                    explore: {
                      initialRouteName: 'Explore',
                      screens: {
                        Explore: 'explore',
                        PremiumTracks: 'explore/premium-tracks',
                        TrendingPlaylists: 'explore/playlists',
                        TrendingUnderground: 'explore/underground',
                        LetThemDJ: 'explore/let-them-dj',
                        TopAlbums: 'explore/top-albums',
                        UnderTheRadar: 'explore/under-the-radar',
                        BestNewReleases: 'explore/best-new-releases',
                        Remixables: 'explore/remixables',
                        MostLoved: 'explore/most-loved',
                        FeelingLucky: 'explore/feeling-lucky',
                        HeavyRotation: 'explore/heavy-rotation',
                        ChillPlaylists: 'explore/chill',
                        IntensePlaylists: 'explore/intense',
                        IntimatePlaylists: 'explore/intimate',
                        ProvokingPlaylists: 'explore/provoking',
                        UpbeatPlaylists: 'explore/upbeat'
                      }
                    },
                    library: {
                      screens: {
                        Library: 'library'
                      }
                    },
                    profile: {
                      screens: {
                        UserProfile: {
                          path: 'profile',
                          screens: {
                            Tracks: 'tracks',
                            Albums: 'albums',
                            Playlists: 'playlists',
                            Reposts: 'reposts',
                            Collectibles: 'collectibles'
                          }
                        },
                        SettingsScreen: {
                          path: 'settings'
                        }
                      }
                    }
                  }
                },
                Upload: {
                  path: 'upload'
                },
                WalletConnect: {
                  initialRouteName: 'Wallets',
                  screens: {
                    Wallets: 'wallets'
                  }
                }
              }
            }
          }
        },
        ResetPassword: {
          path: 'reset-password'
        }
      }
    },
    // TODO: This should be unit tested
    getStateFromPath: (path, options) => {
      const pathPart = (path: string) => (index: number) => {
        return path.split('/')[index]
      }

      // Add leading slash if it is missing
      if (path[0] !== '/') path = `/${path}`

      path = path.replace('#embed', '')

      const walletConnectPath = /^\/(wallet-connect)/
      if (path.match(walletConnectPath)) {
        path = `${path.replace(
          walletConnectPath,
          '/wallets'
        )}&path=wallet-connect`
      }

      const walletSignPath = /^\/(wallet-sign-message)/
      if (path.match(walletSignPath)) {
        path = `${path.replace(
          walletSignPath,
          '/wallets'
        )}&path=wallet-sign-message`
      }

      if (path.match(`^/app-redirect`)) {
        // Remove the app-redirect prefix if present
        path = path.replace(`/app-redirect`, '')
      }

      // Strip the trending query param because `/trending` will
      // always go to ThisWeek
      if (path.match(/^\/trending/)) {
        path = '/trending'
      }

      // Opaque ID routes
      // /tracks/Nz9yBb4
      if (path.match(/^\/tracks\//)) {
        const id = decodeHashId(pathPart(path)(2))
        return createFeedStackState({
          name: 'Track',
          params: {
            id
          }
        })
      }

      // /users/Nz9yBb4
      if (path.match(/^\/users\//)) {
        const id = decodeHashId(pathPart(path)(2))
        return createFeedStackState({
          name: 'Profile',
          params: {
            id
          }
        })
      }

      // /playlists/Nz9yBb4
      if (path.match(/^\/playlists\//)) {
        const id = decodeHashId(pathPart(path)(2))
        return createFeedStackState({
          name: 'Profile',
          params: {
            id
          }
        })
      }

      const { query } = queryString.parseUrl(path)
      const { login, warning } = query

      if (login && warning) {
        path = queryString.stringifyUrl({ url: '/reset-password', query })
      }

      if (path.match(`^/${account?.handle}(/|$)`)) {
        // If the path is the current user and set path as `/profile`
        path = path.replace(`/${account?.handle}`, '/profile')
      } else {
        // If the path has two parts
        if (path.match(/^\/[^/]+\/[^/]+$/)) {
          // If the path is to audio-nft-playlist, reroute to feed
          if (path.match(/^\/[^/]+\/audio-nft-playlist$/)) {
            path = '/feed'
          }
          // If the path doesn't match a profile tab, it's a track
          else if (
            !path.match(
              /^\/[^/]+\/(tracks|albums|playlists|reposts|collectibles)$/
            )
          ) {
            path = `/track${path}`
          }
        }

        if (path.match(/^\/[^/]+\/playlist\/[^/]+$/)) {
          // set the path as `collection`
          path = path.replace(
            /(^\/[^/]+\/)(playlist)(\/[^/]+$)/,
            '$1collection$3'
          )
          path = `${path}?collectionType=playlist`
        } else if (path.match(/^\/[^/]+\/album\/[^/]+$/)) {
          // set the path as `collection`
          path = path.replace(/(^\/[^/]+\/)(album)(\/[^/]+$)/, '$1collection$3')
          path = `${path}?collectionType=album`
        }
      }

      return getStateFromPath(path, options)
    }
  }

  return (
    <RNNavigationContainer
      linking={linking}
      theme={navigationThemes[theme]}
      ref={navigationRef}
      onReady={() => {
        routeNameRef.current = getPrimaryRoute(navigationRef.getRootState())
      }}
      onStateChange={() => {
        // Record screen views for the primary routes
        // Secondary routes (e.g. Track, Collection, Profile) are recorded via
        // an effect in the corresponding component
        const previousRouteName = routeNameRef.current
        const currentRouteName = getPrimaryRoute(navigationRef.getRootState())

        if (currentRouteName && previousRouteName !== currentRouteName) {
          screen({ route: `/${currentRouteName}` })
        }

        routeNameRef.current = currentRouteName
      }}
    >
      <AppTabNavigationProvider>{children}</AppTabNavigationProvider>
    </RNNavigationContainer>
  )
}

export default NavigationContainer
