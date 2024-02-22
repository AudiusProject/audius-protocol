import { createContext, useContext, useState, ReactNode } from 'react'

import { ProfilePicture } from '@audius/sdk'
import { useNavigate } from 'react-router-dom'

export type AuthedUser = {
  userId: number
  handle: string
  name: string
  verified: boolean
  profilePicture: ProfilePicture | null
  isAdmin: boolean
}

type AuthContextType = {
  user: AuthedUser | null
  login: (encodedJwt: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: async () => {}
})

export const AuthProvider = ({
  initialUser,
  children
}: {
  initialUser: AuthedUser | null
  children: ReactNode
}) => {
  const [user, setUser] = useState(initialUser)
  const navigate = useNavigate()

  const login = async (encodedJwt: string) => {
    const response = await fetch('/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token: encodedJwt })
    })

    if (!response.ok) {
      console.error('Login failed: ', response)
    } else {
      setUser((await response.json()).user)
      navigate('/admin', { replace: true })
    }
  }

  const logout = async () => {
    const response = await fetch('/auth/logout', {
      method: 'POST',
      credentials: 'include'
    })
    if (response.ok) {
      setUser(null)
      navigate('/login', { replace: true })
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
