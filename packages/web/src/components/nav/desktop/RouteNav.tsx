import { useCallback } from 'react'

import {
  Flex,
  IconButton,
  IconCaretLeft,
  IconCaretRight,
  useTheme
} from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { goBack, goForward } from 'utils/navigation'

export const RouteNav = () => {
  const dispatch = useDispatch()
  const { spacing } = useTheme()
  const handleGoBack = useCallback(() => {
    dispatch(goBack())
  }, [dispatch])

  const handleGoForward = useCallback(() => {
    dispatch(goForward())
  }, [dispatch])

  return (
    <Flex
      alignItems='center'
      gap='xl'
      ph={spacing.l}
      justifyContent='flex-end'
      borderBottom='default'
      backgroundColor='surface1'
      css={{ minHeight: `${spacing.unit10}px`, '-webkit-app-region': 'drag' }}
    >
      <IconButton
        aria-label='Go Back'
        icon={IconCaretLeft}
        size='m'
        color='subdued'
        onClick={handleGoBack}
        css={{ '-webkit-app-region': 'no-drag' }}
      />
      <IconButton
        aria-label='Go Forward'
        icon={IconCaretRight}
        size='m'
        color='subdued'
        onClick={handleGoForward}
        css={{ '-webkit-app-region': 'no-drag' }}
      />
    </Flex>
  )
}
