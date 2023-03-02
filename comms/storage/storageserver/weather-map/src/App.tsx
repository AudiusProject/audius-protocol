import { QueryClient, QueryClientProvider } from 'react-query'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import Home from './routes/Home'
import Search from './routes/Search'
import Shard from './routes/Shard'
import Wrapper from './routes/Wrapper'

const queryClient = new QueryClient()
const baseURL = '/storage'

export default function App() {
  const router = createBrowserRouter(
    [
      {
        path: '/',
        element: <Wrapper />,
        children: [
          {
            path: '/',
            element: <Home />,
          },
          {
            path: '/search/:query',
            element: <Search />,
          },
          {
            path: `/shard/:shard`,
            element: <Shard />,
          },
        ],
      },
    ],
    { basename: baseURL },
  )
  return (
    <div className="App">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </div>
  )
}
