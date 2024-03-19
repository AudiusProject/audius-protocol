import { Suspense } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
  defer,
  RouterProvider,
  Await,
  useLoaderData,
  useOutlet
} from 'react-router-dom'

import ArtistHome from 'pages/ArtistHome'
import Login from 'pages/Login/Login'
import Upload from 'pages/Upload/Upload'
import { AudiusSdkProvider } from 'providers/AudiusSdkProvider'
import { AuthedUser, AuthProvider } from 'providers/AuthProvider'
import { ThemeProvider } from 'providers/ThemeProvider'
import { trpc } from 'utils/trpc'

import AuthedLayout from './AuthedLayout'
import { Collection } from './Collection/Collection'
import { LoadingSpinner } from './LoadingSpinner/LoadingSpinner'
import PublicLayout from './PublicLayout'

const fetchUserSession = async () => {
  const response = await fetch('/auth/session', { credentials: 'include' })
  if (response.ok) {
    const data = await response.json()
    return data.user
  }
  return null
}

type LoaderData = {
  userPromise: Promise<AuthedUser | null>
}

// Root layout for the app. Fetches the user session before rendering the app (shows LoadingSpinner while fetching)
const AuthLayout = () => {
  const outlet = useOutlet()
  const { userPromise } = useLoaderData() as LoaderData

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Await resolve={userPromise} errorElement={<>Something went wrong!</>}>
        {(user: AuthedUser | null) => (
          <AuthProvider initialUser={user}>
            <AudiusSdkProvider>{outlet}</AudiusSdkProvider>
          </AuthProvider>
        )}
      </Await>
    </Suspense>
  )
}

const ddexRouter = createBrowserRouter(
  createRoutesFromElements(
    <Route
      element={<AuthLayout />}
      loader={() => defer({ userPromise: fetchUserSession() })}
    >
      {/* Authed admin routes */}
      <Route path='/admin' element={<AuthedLayout isAdmin />}>
        <Route path='' element={<Upload />} />
        <Route
          path='pending-releases'
          element={<Collection collection='pending_releases' />}
        />
        <Route
          path='published-releases'
          element={<Collection collection='published_releases' />}
        />
      </Route>

      {/* Authed non-admin routes */}
      <Route path='/artist' element={<AuthedLayout />}>
        <Route path='' element={<ArtistHome />} />
      </Route>

      {/* Unauthed and fallback routes */}
      <Route path='*' element={<PublicLayout />}>
        <Route path='login' element={<Login />} />
      </Route>
    </Route>
  )
)

const App = () => {
  const queryClient = new QueryClient()
  const trpcClient = trpc.createClient({
    links: [
      httpBatchLink({
        url: '/api/trpc'
      })
    ]
  })

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <RouterProvider router={ddexRouter} />
        </ThemeProvider>
      </QueryClientProvider>
    </trpc.Provider>
  )
}

export default App
