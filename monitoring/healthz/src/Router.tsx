import {
  HashRouter,
  Link,
  Outlet,
  RouteObject,
  useRoutes,
} from 'react-router-dom'
import { ContentHealth } from './Content'
import { DiscoveryFeed } from './DiscoveryFeed'
import { DiscoveryHealth } from './DiscoveryHealth'
import { DiscoverySearch } from './DiscoverySearch'
import { DiscoveryTrending } from './DiscoveryTrending'
import { DiscoveryPlugins } from './DiscoveryPlugins'
import { IdTranslator } from './IdTranslator'
import { DMs } from './DMs'
import { Mediorum } from './Mediorum'
import { EnvironmentSelector } from './components/EnvironmentSelector'
import { DMMatrix } from './DMMatrix'
import { Rendezvous } from './Rendezvous'

const routeList: RouteObject[] = [
  {
    path: '',
    element: <Layout />,
    children: [
      { path: 'discovery', element: <DiscoveryHealth /> },
      { path: 'content', element: <ContentHealth /> },
      {
        path: 'trending',
        element: (
          <DiscoveryTrending trendingEndpoint="/v1/tracks/trending" />
        ),
      },
      {
        path: 'trending_underground',
        element: (
          <DiscoveryTrending trendingEndpoint="/v1/tracks/trending/underground" />
        ),
      },
      {
        path: 'trending_playlists',
        element: (
          <DiscoveryTrending trendingEndpoint="/v1/playlists/trending/BDNxn" />
        ),
      },
      { path: 'feed', element: <DiscoveryFeed /> },
      { path: 'search', element: <DiscoverySearch /> },
      { path: 'id', element: <IdTranslator /> },
      { path: 'dms', element: <DMs /> },
      { path: 'dm_matrix', element: <DMMatrix /> },
      { path: 'mediorum', element: <Mediorum /> },
      { path: 'plugins', element: <DiscoveryPlugins /> },
      { path: 'rendezvous', element: <Rendezvous /> },

      { path: '', element: <DiscoveryHealth /> },
    ],
  },
]

export function Router() {
  return (
    <HashRouter>
      <InnerRouter />
    </HashRouter>
  )
}

function InnerRouter() {
  return useRoutes(routeList)
}

function Layout() {
  const routes = routeList[0].children!

  return (
    <div>
      <div style={{ padding: 10, background: 'aliceblue' }}>
        {routes.map((route) => (
          <Link
            key={route.path!}
            to={'/' + route.path}
            style={{ marginRight: 10 }}
          >
            {route.path!}
          </Link>
        ))}
      </div>
      <EnvironmentSelector />
      <Outlet />
    </div>
  )
}
