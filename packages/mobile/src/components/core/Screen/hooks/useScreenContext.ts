import { useContext } from 'react'

import { ScreenContext } from '../ScreenContextProvider'

export const useScreenContext = () => {
  return useContext(ScreenContext)
}
