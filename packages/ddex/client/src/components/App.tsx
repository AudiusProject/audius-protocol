import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'

import Home from 'pages/Home/Home'
import { Indexed } from 'pages/Indexed'
import { Parsed } from 'pages/Parsed'
import { Published } from 'pages/Published'

import Layout from './Layout'

const App = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/indexed' element={<Indexed />} />
          <Route path='/parsed' element={<Parsed />} />
          <Route path='/published' element={<Published />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
