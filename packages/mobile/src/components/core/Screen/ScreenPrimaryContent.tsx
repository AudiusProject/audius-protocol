import { useEffectOnce } from 'react-use'

import { useScreenContext } from './hooks/useScreenContext'

export const ScreenPrimaryContent = ({ children }) => {
  const { isPrimaryContentReady, setIsPrimaryContentReady } = useScreenContext()
  useEffectOnce(() => {
    requestAnimationFrame(() => {
      setIsPrimaryContentReady(true)
    })
  })
  return isPrimaryContentReady ? children : null
}
