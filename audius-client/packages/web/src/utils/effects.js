import { useEffect } from 'react'

export const useOnResizeEffect = handleResize => {
  return useEffect(() => {
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [handleResize])
}
