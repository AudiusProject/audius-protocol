import { ReactNode, useCallback } from 'react'

import {
  Box,
  Flex,
  FlexProps,
  IconAudiusLogoHorizontal,
  IconCaretLeft,
  IconCloseAlt,
  PlainButton,
  useTheme
} from '@audius/harmony'
import { Route, Switch, useHistory, useRouteMatch } from 'react-router-dom'

import { useMedia } from 'hooks/useMedia'
import {
  SIGN_IN_PAGE,
  SIGN_UP_ARTISTS_PAGE,
  SIGN_UP_EMAIL_PAGE,
  SIGN_UP_FINISH_PROFILE_PAGE,
  SIGN_UP_GENRES_PAGE,
  SIGN_UP_HANDLE_PAGE,
  SIGN_UP_PAGE,
  TRENDING_PAGE
} from 'utils/route'

import { useDetermineAllowedRoute } from '../utils/useDetermineAllowedRoutes'

import { ProgressHeader } from './ProgressHeader'

export const useIsBackAllowed = () => {
  const match = useRouteMatch<{ currentPath: string }>('/signup/:currentPath')
  const determineAllowedRoute = useDetermineAllowedRoute()
  if (match?.params.currentPath) {
    const { allowedRoutes } = determineAllowedRoute(match?.params.currentPath)
    const currentRouteIndex = allowedRoutes.indexOf(match.params.currentPath)
    const isBackAllowed = allowedRoutes.length > 1 && currentRouteIndex > 0
    return isBackAllowed
  }
  return false
}

type HeaderRootProps = FlexProps & {
  children: ReactNode
}

const HeaderRoot = (props: HeaderRootProps) => {
  const { children, ...other } = props
  const isBackAllowed = useIsBackAllowed()
  const { spacing } = useTheme()

  return (
    <Flex
      ph='xl'
      w='100%'
      borderBottom={isBackAllowed ? 'default' : undefined}
      alignItems='center'
      backgroundColor='white'
      css={{ minHeight: spacing['3xl'], zIndex: 1, flexShrink: 0 }}
      {...other}
    >
      {children}
    </Flex>
  )
}

export const NavHeader = () => {
  const isBackAllowed = useIsBackAllowed()
  const history = useHistory()
  const { isMobile } = useMedia()
  const { iconSizes } = useTheme()

  const handleClose = useCallback(() => {
    history.push(TRENDING_PAGE)
  }, [history])

  const audiusLogo = <IconAudiusLogoHorizontal color='subdued' sizeH='l' />

  return (
    <Switch>
      <Route path={[SIGN_IN_PAGE, SIGN_UP_PAGE, SIGN_UP_EMAIL_PAGE]} exact>
        {isMobile ? (
          <HeaderRoot pv='l'>
            <PlainButton
              size='large'
              css={{ padding: 0 }}
              onClick={handleClose}
              iconLeft={IconCloseAlt}
              variant='subdued'
            />
          </HeaderRoot>
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
          <HeaderRoot justifyContent='center' pt='l'>
            <Box css={{ position: 'absolute', top: 20, left: 24 }}>
              {audiusLogo}
            </Box>
            <ProgressHeader />
          </HeaderRoot>
        </Route>
      ) : null}
      <Route path='*'>
        <HeaderRoot justifyContent='space-between' pv='l'>
          {isBackAllowed ? (
            <>
              <PlainButton
                size='large'
                css={{ padding: 0 }}
                onClick={history.goBack}
                iconLeft={IconCaretLeft}
                variant='subdued'
              />
              {audiusLogo}
              <Box css={{ width: iconSizes.m }} />
            </>
          ) : (
            <Flex w='100%' justifyContent='center'>
              {audiusLogo}
            </Flex>
          )}
        </HeaderRoot>
      </Route>
    </Switch>
  )
}
