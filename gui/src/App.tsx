import { BrowserRouter, Link, Outlet, Route, Routes } from 'react-router-dom'
import { PlaylistDetail } from './pages/PlaylistDetail'
import { Profile } from './pages/Profile'
import { TrackDetail } from './pages/TrackDetail'

function Layout() {
  return (
    <div>
      <Link to="/">Home</Link>
      <Link to="/stereosteve">stereosteve</Link>
      <hr />
      <Outlet />
    </div>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<h1>home</h1>} />
          <Route path=":handle" element={<Profile />} />
          <Route path=":handle/:track" element={<TrackDetail />} />
          <Route
            path=":handle/playlist/:playlist"
            element={<PlaylistDetail />}
          />
          <Route path=":handle/album/:playlist" element={<PlaylistDetail />} />
        </Route>

        {/* <Route path="/" element={<Layout />}>
      <Route index element={<App />} />
      <Route path="teams" element={<h1>teams</h1>}>
        <Route path="new" element={<h1>new team</h1>} />
      </Route>
    </Route> */}
      </Routes>
    </BrowserRouter>
  )
}
