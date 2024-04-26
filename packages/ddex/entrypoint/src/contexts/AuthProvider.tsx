import { User } from '@audius/sdk'
import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useSdk } from './AudiusSdkProvider'

export enum Status {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

type AuthContext = {
  user?: User,
  status: Status,
  logout: () => void
}

const tokenLocalStorageKey = '@audius/sdk/token'

const AuthContext = createContext<AuthContext>({
  status: Status.IDLE,
  logout: () => {}
});

export const AuthProvider = ({ children }: { children: ReactNode}) => {
  const sdk = useSdk()
  const [user, setUser] = useState<User | undefined>(undefined)
  const [status, setStatus] = useState(Status.IDLE)

  useEffect(() => {
    const e = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      let token = localStorage.getItem(tokenLocalStorageKey)
      if (!token) {
        token = urlParams.get('token')
      }
      if (!token) {
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
      setStatus(Status.SUCCESS)
    }
    e()
  }, [sdk])

  const logout = useCallback(() => {
    localStorage.removeItem(tokenLocalStorageKey)
  }, [])

  return (
    <AuthContext.Provider value={{ user, status, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
