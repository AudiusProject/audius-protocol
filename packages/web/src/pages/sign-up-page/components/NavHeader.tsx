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
import { Route, Switch, useHistory, useRouteMatch } from 'react-router-dom'

import { getSignOn } from 'common/store/pages/signon/selectors'
import { useMedia } from 'hooks/useMedia'
import { useSelector } from 'utils/reducer'
import {
  SIGN_UP_ARTISTS_PAGE,
  SIGN_UP_FINISH_PROFILE_PAGE,
  SIGN_UP_GENRES_PAGE,
  SIGN_UP_HANDLE_PAGE,
  TRENDING_PAGE
} from 'utils/route'

import { determineAllowedRoute } from '../utils'

import { ProgressHeader } from './ProgressHeader'

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
  const { isMobile } = useMedia()

  const handleClose = useCallback(() => {
    history.push(TRENDING_PAGE)
  }, [history])

  const audiusLogo = (
    <IconAudiusLogoHorizontal color='subdued' css={{ height: iconSizes.l }} />
  )

  const header = (
    <>
      <PlainButton
        size={PlainButtonSize.LARGE}
        css={{ padding: 0 }}
        onClick={isBackAllowed ? history.goBack : handleClose}
        iconLeft={isBackAllowed ? IconCaretLeft : IconCloseAlt}
        variant={PlainButtonType.SUBDUED}
      />
      {isBackAllowed ? audiusLogo : null}
      <Box css={{ width: iconSizes.m }} />
    </>
  )

  return (
    <Flex
      ph='xl'
      pv='l'
      w='100%'
      borderBottom={isBackAllowed ? 'default' : undefined}
      alignItems='center'
      justifyContent='space-between'
    >
      <Switch>
        <Route
          path={[
            SIGN_UP_HANDLE_PAGE,
            SIGN_UP_FINISH_PROFILE_PAGE,
            SIGN_UP_GENRES_PAGE,
            SIGN_UP_ARTISTS_PAGE
          ]}
        >
          {isMobile ? (
            header
          ) : (
            <>
              {audiusLogo}
              <ProgressHeader />
              <Box css={{ width: 200 }} />
            </>
          )}
        </Route>
        <Route path='*'>{header}</Route>
      </Switch>
    </Flex>
  )
}
