import { BrowserRouter, Link, Outlet, Route, Routes } from 'react-router-dom'
import { PlayerUI } from './components/Player'
import { PlaylistDetail } from './pages/PlaylistDetail'
import { Profile } from './pages/Profile'
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
        <Link to="/jan_larz">jan_larz</Link>
        <Link to="/alunaaa">alunaaa</Link>
      </div>
      <Outlet />
      <PlayerUI />
    </div>
  )
}

export function App() {
  return (
    <NowPlaying.Provider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<h1>home</h1>} />
            <Route path=":handle" element={<Profile />} />
            <Route
              path=":handle/:trackSlug/:trackId"
              element={<TrackDetail />}
            />
            <Route
              path=":handle/playlist/:playlistSlug"
              element={<PlaylistDetail />}
            />
            <Route
              path=":handle/album/:playlist"
              element={<PlaylistDetail />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </NowPlaying.Provider>
  )
}
