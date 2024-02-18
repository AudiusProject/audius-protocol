import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Profile from './Profile'
import Collection from './Collection'
import Track from './Track'

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/frame/track/:trackName' element={<Track />} />
        <Route path='/frame/profile/:handle' element={<Profile />} />
        <Route
          path='/frame/collection/:collectionName'
          element={<Collection />}
        />
      </Routes>
    </Router>
  )
}

export default App
