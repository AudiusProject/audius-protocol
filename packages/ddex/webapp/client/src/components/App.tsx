import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'

import { Deliveries } from 'pages/Deliveries'
import { Home } from 'pages/Home/Home'
import { PendingReleases } from 'pages/PendingReleases'
import { PublishedReleases } from 'pages/PublishedReleases'

import Layout from './Layout'

const App = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/deliveries' element={<Deliveries />} />
          <Route path='/pending-releases' element={<PendingReleases />} />
          <Route path='/published-releases' element={<PublishedReleases />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
