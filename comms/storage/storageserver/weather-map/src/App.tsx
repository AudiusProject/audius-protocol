import { QueryClient, QueryClientProvider } from 'react-query'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import History from './routes/History'
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
          {
            path: `/history`,
            element: <History />,
          },
        ],
      },
    ],
    { basename: baseURL },
  )
  return (
    <div className="h-full w-full bg-white dark:bg-gray-900">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </div>
  )
}
