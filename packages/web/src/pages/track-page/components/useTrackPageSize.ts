import { useMedia } from 'react-use'

export const useTrackPageSize = () => {
  const isDesktop = useMedia('(min-width: 1054px)')
  const isMobile = useMedia('(max-width: 768px)')
  return { isDesktop, isMobile }
}
