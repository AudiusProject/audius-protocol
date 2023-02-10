import { QueryClient, QueryClientProvider } from 'react-query'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import Home from './routes/Home'
import Shard from './routes/Shard'
import Wrapper from './routes/Wrapper'

const queryClient = new QueryClient()
const baseURL = '/storage/weather'

export default function App() {
  const router = createBrowserRouter(
    [
      {
        path: `/`,
        element: <Wrapper />,
        children: [
          {
            path: `/`,
            element: <Home />,
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
