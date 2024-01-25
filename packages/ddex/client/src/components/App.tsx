import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'

import Home from 'pages/Home/Home'

import Layout from './Layout'

const App = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path='/' element={<Home />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
