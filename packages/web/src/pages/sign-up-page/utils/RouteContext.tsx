import { ReactNode, createContext, useEffect, useState } from 'react'

import { useHistory } from 'react-router-dom'

export const RouteContext = createContext({
  isGoBack: false
})

type RouteContextProviderProps = {
  children: ReactNode
}

export const RouteContextProvider = (props: RouteContextProviderProps) => {
  const { children } = props

  const history = useHistory()
  const [isGoBack, setIsGoBack] = useState(false)

  useEffect(() => {
    const unlisten = history.listen((_location, action) => {
      if (action === 'POP') {
        setIsGoBack(true)
      } else {
        setIsGoBack(false)
      }
    })

    return unlisten
  }, [history])

  return (
    <RouteContext.Provider value={{ isGoBack }}>
      {children}
    </RouteContext.Provider>
  )
}
