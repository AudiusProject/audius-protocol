import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Profile from './Profile'
import Track from './Track'

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/frame/track/:handle/:slug' element={<Track />} />
        <Route path='/frame/profile/:handle' element={<Profile />} />
      </Routes>
    </Router>
  )
}

export default App
