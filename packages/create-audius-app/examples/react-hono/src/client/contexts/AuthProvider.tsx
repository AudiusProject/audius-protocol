import { User } from '@audius/sdk'
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react'
import { useSdk } from '../hooks/useSdk'
import { Status } from './types'

type AuthContext = {
  user?: User
  login: (user: User, token: string) => void
  status: Status
  logout: () => void
}

const tokenLocalStorageKey = '@audius/sdk/token'

const AuthContext = createContext<AuthContext>({
  status: Status.IDLE,
  logout: () => {},
  login: () => {}
})

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { sdk } = useSdk()
  const [user, setUser] = useState<User | undefined>(undefined)
  const [status, setStatus] = useState(Status.IDLE)

  useEffect(() => {
    if (sdk) {
      const fn = async () => {
        try {
          setStatus(Status.LOADING)
          const token = localStorage.getItem(tokenLocalStorageKey)
          if (!token) {
            setStatus(Status.SUCCESS)
            return
          }
          const tokenRes = await sdk?.users.verifyIDToken({ token })
          if (!tokenRes?.data?.userId) {
            return
          }

          const id = tokenRes.data.userId
          const userRes = await sdk?.users.getUser({ id })
          if (!userRes?.data) {
            return
          }

          const user = userRes.data
          setUser(user)
          localStorage.setItem(tokenLocalStorageKey, token)
          setStatus(Status.SUCCESS)
        } catch (e) {
          console.error(e)
          localStorage.removeItem(tokenLocalStorageKey)
          setStatus(Status.ERROR)
        }
      }
      fn()
    }
  }, [sdk])

  const login = useCallback((user: User, token: string) => {
    setUser(user)
    localStorage.setItem(tokenLocalStorageKey, token)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(tokenLocalStorageKey)
    // Reload without query params
    window.location.href = window.location.pathname
  }, [])

  return (
    <AuthContext.Provider value={{ user, status, logout, login }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
