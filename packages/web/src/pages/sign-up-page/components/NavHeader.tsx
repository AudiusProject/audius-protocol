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
  SIGN_UP_EMAIL_PAGE,
  SIGN_UP_FINISH_PROFILE_PAGE,
  SIGN_UP_GENRES_PAGE,
  SIGN_UP_HANDLE_PAGE,
  TRENDING_PAGE
} from 'utils/route'

import { determineAllowedRoute } from '../utils/determineAllowedRoutes'

import { ProgressHeader } from './ProgressHeader'

export const useIsBackAllowed = () => {
  const match = useRouteMatch<{ currentPath: string }>('/signup/:currentPath')
  const signUpState = useSelector(getSignOn)
  if (match?.params.currentPath) {
    const { allowedRoutes } = determineAllowedRoute(
      signUpState,
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

  const header = isBackAllowed ? (
    <>
      <PlainButton
        size={PlainButtonSize.LARGE}
        css={{ padding: 0 }}
        onClick={history.goBack}
        iconLeft={IconCaretLeft}
        variant={PlainButtonType.SUBDUED}
      />
      {audiusLogo}
      <Box css={{ width: iconSizes.m }} />
    </>
  ) : (
    audiusLogo
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
        <Route path={[SIGN_UP_EMAIL_PAGE]}>
          {isMobile ? (
            <PlainButton
              size={PlainButtonSize.LARGE}
              css={{ padding: 0 }}
              onClick={handleClose}
              iconLeft={IconCloseAlt}
              variant={PlainButtonType.SUBDUED}
            />
          ) : null}
        </Route>
        {!isMobile ? (
          <Route
            path={[
              SIGN_UP_HANDLE_PAGE,
              SIGN_UP_FINISH_PROFILE_PAGE,
              SIGN_UP_GENRES_PAGE,
              SIGN_UP_ARTISTS_PAGE
            ]}
          >
            {audiusLogo}
            <ProgressHeader />
            <Box css={{ width: 200 }} />
          </Route>
        ) : null}
        <Route path='*'>{header}</Route>
      </Switch>
    </Flex>
  )
}
