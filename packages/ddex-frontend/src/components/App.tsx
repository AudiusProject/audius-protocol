import Layout from './Layout'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Ddex from 'pages/DDEX'

const App = () => {
  return (
    <Router basename="/ddex">
      <Layout>
        <Routes>
          <Route path="/" element={<Ddex />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
