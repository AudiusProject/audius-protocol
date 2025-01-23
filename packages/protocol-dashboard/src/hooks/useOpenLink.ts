import React, { useCallback } from 'react'

export const useOpenLink = (route: string) => {
  const openLink = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      window.open(route, '_blank')
    },
    [route]
  )
  return openLink
}

export default useOpenLink
