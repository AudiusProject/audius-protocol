import {
  HashRouter,
  Link,
  Outlet,
  RouteObject,
  useRoutes,
} from 'react-router-dom'
import { APIDiff } from './APIDiff'
import { ContentHealth } from './Content'
import { DiscoveryFeed } from './DiscoveryFeed'
import { DiscoveryHealth } from './DiscoveryHealth'
import { DiscoverySearch } from './DiscoverySearch'
import { DiscoveryTrending } from './DiscoveryTrending'
import { IdTranslator } from './IdTranslator'

const routeList: RouteObject[] = [
  {
    path: '',
    element: <Layout />,
    children: [
      {
        path: '/discovery',
        children: [
          { path: 'health', element: <DiscoveryHealth /> },
          { path: 'trending', element: <DiscoveryTrending /> },
          { path: 'feed', element: <DiscoveryFeed /> },
          { path: 'search', element: <DiscoverySearch /> },
          { path: 'diff', element: <APIDiff /> },
          { path: 'id', element: <IdTranslator /> },
        ],
      },

      {
        path: '/content',
        children: [{ path: 'health', element: <ContentHealth /> }],
      },

      { path: '/', element: <DiscoveryHealth /> },
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
  const discoveryRoutes = routeList[0].children![0].children!

  return (
    <div>
      <div style={{ padding: 10, background: 'aliceblue' }}>
        {discoveryRoutes.map((route) => (
          <Link
            key={route.path!}
            to={'/discovery/' + route.path}
            style={{ marginRight: 10 }}
          >
            {route.path!}
          </Link>
        ))}

        <span style={{ marginRight: 10 }}> | </span>
        <Link to={'/content/health'} style={{ marginRight: 10 }}>
          Content Health (WIP)
        </Link>
      </div>
      <Outlet />
    </div>
  )
}

function Index() {
  const discoveryRoutes = routeList[0].children![0].children!
  const contentRoutes = routeList[0].children![1].children!
  return (
    <div>
      <h3>Discovery</h3>
      <ul>
        {discoveryRoutes.map((route) => (
          <li key={route.path!}>
            <Link to={'/discovery/' + route.path}>{route.path!}</Link>
          </li>
        ))}
      </ul>

      <h3>Content</h3>
      <ul>
        {contentRoutes.map((route) => (
          <li key={route.path!}>
            <Link to={'/content/' + route.path}>{route.path!}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
