import {
  createBrowserRouter,
  Link,
  Outlet,
  RouterProvider,
} from 'react-router-dom'
import { apolloClient } from './clients'
import { PlayerUI } from './components/Player'
import { ProfileLayoutDocument, ProfileLayoutQuery } from './generated/graphql'
import { Feed } from './pages/Feed'
import { PlaylistDetail } from './pages/PlaylistDetail'
import { Profile } from './pages/Profile'
import { ProfileLayout } from './pages/ProfileLayout'
import { ProfileReposts } from './pages/ProfileReposts'
import { TrackDetail } from './pages/TrackDetail'
import { NowPlaying } from './stores/nowPlaying'

function Layout() {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: 10,
          padding: 10,
          background: '#303',
        }}
      >
        <Link to="/">Home</Link>
        <Link to="/stereosteve">stereosteve</Link>
        <Link to="/rayjacobson">rayjacobson</Link>
        <Link to="/jan_larz">jan_larz</Link>
        <Link to="/alunaaa">alunaaa</Link>
      </div>
      <Outlet />
      <PlayerUI />
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Feed />,
      },
      {
        path: ':handle',
        element: <ProfileLayout />,
        loader: async ({ params }) => {
          const { data } = await apolloClient.query<ProfileLayoutQuery>({
            query: ProfileLayoutDocument,
            variables: {
              ...params,
            },
          })

          if (!data?.user) {
            throw new Response('Not Found', { status: 404 })
          }
          return data
        },
        children: [
          {
            index: true,
            element: <Profile />,
          },
          {
            path: 'reposts',
            element: <ProfileReposts />,
          },
          {
            path: ':trackSlug/:trackId',
            element: <TrackDetail />,
          },
          {
            path: 'playlist/:playlistSlug',
            element: <PlaylistDetail />,
          },
        ],
      },
    ],
  },
])

export function App() {
  return (
    <NowPlaying.Provider>
      <RouterProvider router={router} />
    </NowPlaying.Provider>
  )
}
