import { ReactNode, useCallback } from 'react'

import {
  Box,
  Flex,
  FlexProps,
  IconAudiusLogoHorizontal,
  IconCaretLeft,
  IconCloseAlt,
  PlainButton,
  PlainButtonSize,
  PlainButtonType,
  useTheme
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
  SIGN_UP_PAGE,
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
      css={{ minHeight: spacing['3xl'], zIndex: 1 }}
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
      <Route path={[SIGN_UP_PAGE, SIGN_UP_EMAIL_PAGE]} exact>
        <HeaderRoot pv='l'>
          {isMobile ? (
            <PlainButton
              size={PlainButtonSize.LARGE}
              css={{ padding: 0 }}
              onClick={handleClose}
              iconLeft={IconCloseAlt}
              variant={PlainButtonType.SUBDUED}
            />
          ) : null}
        </HeaderRoot>
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
          )}
        </HeaderRoot>
      </Route>
    </Switch>
  )
}
