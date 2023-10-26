import { useMedia as useMediaQuery } from 'react-use'

export const useMedia = () => {
  const isDesktop = useMediaQuery('(min-width: 1280px)')
  const isTablet = useMediaQuery('(max-width: 1280px) and (min-width: 480px)')
  const isPhone = useMediaQuery('(max-width: 480px)')

  return {
    isDesktop,
    isTablet,
    isPhone,
    isMobile: !isDesktop
  }
}
