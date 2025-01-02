import { ReactNode, createContext, useEffect, useState } from 'react'

import { useNavigationType } from 'react-router-dom'

export const RouteContext = createContext({
  isGoBack: false
})

type RouteContextProviderProps = {
  children: ReactNode
}

export const RouteContextProvider = (props: RouteContextProviderProps) => {
  const { children } = props

  const navigationType = useNavigationType()
  const [isGoBack, setIsGoBack] = useState(false)

  useEffect(() => {
    if (navigationType === 'POP') {
      setIsGoBack(true)
    } else {
      setIsGoBack(false)
    }
  }, [navigationType])

  return (
    <RouteContext.Provider value={{ isGoBack }}>
      {children}
    </RouteContext.Provider>
  )
}
