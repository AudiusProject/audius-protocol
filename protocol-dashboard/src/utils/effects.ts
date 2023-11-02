import { useNavigate } from 'react-router-dom'
import { useCallback } from 'react'

export const usePushRoute = () => {
  const navigate = useNavigate()
  return useCallback((route: string) => navigate(route), [navigate])
}

export const useReplaceRoute = () => {
  const navigate = useNavigate()
  return useCallback((route: string) => navigate(route, { replace: true }), [
    navigate
  ])
}
