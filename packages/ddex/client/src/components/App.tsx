import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'

import Ddex from '../pages/DDEX/DDEX'

import Layout from './Layout'

const App = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path='/' element={<Ddex />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
