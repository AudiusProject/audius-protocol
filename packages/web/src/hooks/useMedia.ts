import { useMedia as useMediaQuery } from 'react-use'

export const useMedia = () => {
  const isDesktop = useMediaQuery('(min-width: 860px)')
  const isTablet = useMediaQuery('(max-width: 860px) and (min-width: 480px)')
  const isPhone = useMediaQuery('(max-width: 480px)')

  return {
    isDesktop,
    isTablet,
    isPhone,
    isMobile: !isDesktop
  }
}
