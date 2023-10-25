import { useMediaQuery } from 'react-responsive'

export const useMedia = () => {
  const isDesktop = useMediaQuery({
    minWidth: '1280px'
  })
  const isTablet = useMediaQuery({ maxWidth: '1280px', minWidth: '480px' })
  const isPhone = useMediaQuery({ maxWidth: '480px' })

  return {
    isDesktop,
    isTablet,
    isPhone,
    isMobile: !isDesktop
  }
}
