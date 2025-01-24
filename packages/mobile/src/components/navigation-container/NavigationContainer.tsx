import { useRef, type ReactNode } from 'react'
import { useEffect } from 'react'

import { Status } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { OptionalHashId } from '@audius/sdk'
import type {
  LinkingOptions,
  NavigationState,
  PartialState
} from '@react-navigation/native'
import {
  NavigationContainer as RNNavigationContainer,
  createNavigationContainerRef,
  getStateFromPath
} from '@react-navigation/native'
import type { reactNavigationIntegration } from '@sentry/react-native'
import queryString from 'query-string'
import { useSelector } from 'react-redux'

import { AppTabNavigationProvider } from 'app/screens/app-screen'
import { screen } from 'app/services/analytics'
import { getPrimaryRoute } from 'app/utils/navigation'
import { useThemeVariant } from 'app/utils/theme'

import { navigationThemes } from './navigationThemes'

const { getUserHandle, getHasAccount, getAccountStatus } = accountSelectors

type NavigationContainerProps = {
  children: ReactNode
  navigationIntegration: ReturnType<typeof reactNavigationIntegration>
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
  const { children, navigationIntegration } = props
  const theme = useThemeVariant()
  const accountHandle = useSelector(getUserHandle)
  const hasAccount = useSelector(getHasAccount)
  const accountStatus = useSelector(getAccountStatus)
  const hasCompletedInitialLoad = useRef(false)

  const routeNameRef = useRef<string>()

  // Ensure that the user's account data is fully loaded before rendering the app.
  // This prevents the NavigationContainer from rendering prematurely, which relies
  // on the hasAccount state to determine how to handle deep links.
  useEffect(() => {
    if (
      !hasCompletedInitialLoad.current &&
      (accountStatus === Status.SUCCESS || accountStatus === Status.ERROR)
    ) {
      hasCompletedInitialLoad.current = true
    }
  }, [accountStatus])

  if (
    !hasCompletedInitialLoad.current &&
    (accountStatus === Status.IDLE ||
      (accountStatus === Status.LOADING && !hasAccount))
  ) {
    return null
  }

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
        SignOnStack: {
          screens: {
            SignOn: 'sign-on'
          }
        },
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
                        } as any, // Nested navigator typing with own params is broken, see: https://github.com/react-navigation/react-navigation/issues/9897
                        SettingsScreen: {
                          path: 'settings'
                        }
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
        const rawResult = path.split('/')[index]
        const queryIndex = rawResult?.indexOf('?') ?? -1
        const trimmed =
          queryIndex > -1 ? rawResult.slice(0, queryIndex) : rawResult
        return trimmed
      }

      // Add leading slash if it is missing
      if (path[0] !== '/') path = `/${path}`

      path = path.replace('#embed', '')

      const connectPath = /^\/(connect)/
      if (path.match(connectPath)) {
        path = `${path.replace(
          connectPath,
          routeNameRef.current ?? '/feed'
        )}&path=connect`
      }

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
        const trackId = OptionalHashId.parse(pathPart(path)(2))
        return createFeedStackState({
          name: 'Track',
          params: {
            trackId
          }
        })
      }

      // /users/Nz9yBb4
      if (path.match(/^\/users\//)) {
        const id = OptionalHashId.parse(pathPart(path)(2))
        return createFeedStackState({ name: 'Profile', params: { id } })
      }

      // /playlists/Nz9yBb4
      if (path.match(/^\/playlists\//)) {
        const collectionId = OptionalHashId.parse(pathPart(path)(2))
        return createFeedStackState({
          name: 'Collection',
          params: { collectionId }
        })
      }

      // /search
      if (path.match(`^/search(/|$)`)) {
        const {
          query: { query, ...filters }
        } = queryString.parseUrl(path)

        return createFeedStackState({
          name: 'Search',
          params: {
            query,
            category: pathPart(path)(2) ?? 'all',
            filters
          }
        })
      }

      const { query } = queryString.parseUrl(path)
      const { login, warning } = query

      if (login && warning) {
        path = queryString.stringifyUrl({ url: '/reset-password', query })
      }

      const settingsPath = /^\/(settings)/
      if (path.match(settingsPath)) {
        const subpath = pathPart(path)(2)
        const subpathParam = subpath != null ? `?path=${subpath}` : ''
        const queryParamsStart = path.indexOf('?')
        const queryParams =
          queryParamsStart > -1 ? `&${path.slice(queryParamsStart + 1)}` : ''
        path = `/settings${subpathParam}${queryParams}`
      } else if (path.match(`^/${accountHandle}(/|$)`)) {
        // If the path is the current user and set path as `/profile`
        path = path.replace(`/${accountHandle}`, '/profile')
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

      if (!hasAccount && !path.match(/^\/reset-password/)) {
        // Redirect to sign in with original path in query params
        const { url, query } = queryString.parseUrl(path)

        // If url is signin or signup, set screen param instead of routeOnCompletion
        if (url === '/signin' || url === '/signup') {
          path = queryString.stringifyUrl({
            url: '/sign-on',
            query: {
              ...query,
              screen: url === '/signin' ? 'sign-in' : 'sign-up'
            }
          })
        } else {
          path = queryString.stringifyUrl({
            url: '/sign-on',
            query: { ...query, screen: 'sign-up', routeOnCompletion: url }
          })
        }
      }

      return getStateFromPath(path, options)
    }
  }

  const onReady = () => {
    routeNameRef.current = getPrimaryRoute(navigationRef.getRootState())
    navigationIntegration.registerNavigationContainer(navigationRef)
  }

  return (
    <RNNavigationContainer
      linking={linking}
      theme={navigationThemes[theme]}
      ref={navigationRef}
      onReady={onReady}
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
