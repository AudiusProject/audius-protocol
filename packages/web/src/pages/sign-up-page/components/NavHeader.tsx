import { useCallback } from 'react'

import {
  Box,
  Flex,
  IconAudiusLogoHorizontal,
  IconCaretLeft,
  IconCloseAlt,
  PlainButton,
  PlainButtonSize,
  PlainButtonType,
  iconSizes
} from '@audius/harmony'
import { useHistory, useRouteMatch } from 'react-router-dom'

import { getSignOn } from 'common/store/pages/signon/selectors'
import { useSelector } from 'utils/reducer'
import { TRENDING_PAGE } from 'utils/route'

import { determineAllowedRoute } from '../utils'

export const useIsBackAllowed = () => {
  const match = useRouteMatch<{ currentPath: string }>('/signup/:currentPath')
  const existingSignUpState = useSelector(getSignOn)
  if (match?.params.currentPath) {
    const { allowedRoutes } = determineAllowedRoute(
      existingSignUpState,
      match?.params.currentPath
    )
    const currentRouteIndex = allowedRoutes.indexOf(match.params.currentPath)
    const isBackAllowed = allowedRoutes.length > 1 && currentRouteIndex > 0
    return isBackAllowed
  }
  return false
}

export const NavHeader = () => {
  const isBackAllowed = useIsBackAllowed()
  const history = useHistory()

  const handleClose = useCallback(() => {
    history.push(TRENDING_PAGE)
  }, [history])

  return (
    <Flex
      ph='xl'
      pv='l'
      w='100%'
      borderBottom={isBackAllowed ? 'default' : undefined}
      alignItems='center'
      justifyContent='space-between'
    >
      <PlainButton
        size={PlainButtonSize.LARGE}
        css={{ padding: 0 }}
        onClick={isBackAllowed ? history.goBack : handleClose}
        iconLeft={isBackAllowed ? IconCaretLeft : IconCloseAlt}
        variant={PlainButtonType.SUBDUED}
      />
      {isBackAllowed ? (
        <IconAudiusLogoHorizontal
          color='subdued'
          css={{ height: iconSizes.l }}
        />
      ) : null}
      <Box css={{ width: iconSizes.m }} />
    </Flex>
  )
}
