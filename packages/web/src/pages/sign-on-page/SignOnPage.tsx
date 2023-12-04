import { useEffect, useState, useRef } from 'react'

import {
  Box,
  Flex,
  IconCloseAlt,
  Paper,
  Text,
  TextLink,
  useTheme
} from '@audius/harmony'
import { Link, Route, Switch, useRouteMatch } from 'react-router-dom'

import djBackground from 'assets/img/2-DJ-4-3.jpg'
import djPortrait from 'assets/img/DJportrait.jpg'
import imagePhone from 'assets/img/imagePhone.png'
import BackgroundWaves from 'components/background-animations/BackgroundWaves'
import { useMedia } from 'hooks/useMedia'
import { SignInPage } from 'pages/sign-in-page/SignInPage'
import { AudiusValues } from 'pages/sign-on-page/AudiusValues'
import SignUpPage from 'pages/sign-up-page'
import {
  SIGN_IN_PAGE,
  SIGN_UP_APP_CTA_PAGE,
  SIGN_UP_CREATE_LOGIN_DETAILS,
  SIGN_UP_EMAIL_PAGE,
  SIGN_UP_PAGE,
  SIGN_UP_PASSWORD_PAGE,
  SIGN_UP_REVIEW_HANDLE_PAGE,
  TRENDING_PAGE
} from 'utils/route'

const messages = {
  newToAudius: 'New to Audius?',
  createAccount: 'Create an Account'
}

export const SignOnPage = () => {
  const { isMobile } = useMedia()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const { spacing, motion } = useTheme()
  const [panelHeight, setPanelHeight] = useState<number | null>(null)
  const onSignInPage = !!useRouteMatch(SIGN_IN_PAGE)

  const panelRef = useRef<HTMLDivElement>(null)

  const collapsedMobilePageMatch = useRouteMatch({
    path: [SIGN_IN_PAGE, SIGN_UP_PAGE, SIGN_UP_EMAIL_PAGE],
    exact: true
  })

  const collapsedDesktopPageMatch = useRouteMatch({
    path: [
      SIGN_IN_PAGE,
      SIGN_UP_PAGE,
      SIGN_UP_EMAIL_PAGE,
      SIGN_UP_PASSWORD_PAGE,
      SIGN_UP_REVIEW_HANDLE_PAGE,
      SIGN_UP_CREATE_LOGIN_DETAILS,
      SIGN_UP_APP_CTA_PAGE
    ],
    exact: true
  })

  const isPageExpanded = isMobile
    ? !collapsedMobilePageMatch
    : !collapsedDesktopPageMatch

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    setIsExpanded(isPageExpanded)
  }, [isPageExpanded])

  useEffect(() => {
    setPanelHeight(null)
  }, [onSignInPage])

  useEffect(() => {
    if (panelRef.current && panelHeight === null) {
      // wait for content to finish rendering
      const calculateHeightTimeout = setTimeout(() => {
        const height = panelRef.current?.getBoundingClientRect().height
        if (height) {
          setPanelHeight(height)
        }
      }, 400)
      return () => clearTimeout(calculateHeightTimeout)
    }
  }, [panelHeight])

  const routes = (
    <Switch>
      <Route path={SIGN_IN_PAGE}>
        <SignInPage />
      </Route>
      <Route path={SIGN_UP_PAGE}>
        <SignUpPage />
      </Route>
    </Switch>
  )

  if (isMobile) {
    return (
      <Flex direction='column' w='100%'>
        <Flex
          ref={panelRef}
          direction='column'
          borderBottomLeftRadius={!isExpanded ? '2xl' : undefined}
          borderBottomRightRadius={!isExpanded ? '2xl' : undefined}
          h={isExpanded ? '100%' : panelHeight || 'auto'}
          css={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            backgroundColor: 'white',
            zIndex: 1,
            transition: `height ${motion.calm}, border-radius ${motion.calm}, transform ${motion.calm} 0.5s`,
            transform: isLoaded ? 'translateY(0px)' : 'translateY(-100%)'
          }}
        >
          {routes}
        </Flex>
        <Flex
          direction='column'
          alignItems='center'
          pb='2xl'
          css={{
            paddingTop: panelHeight ?? 0,
            flexGrow: 1,
            backgroundImage: `radial-gradient(77.16% 77.16% at 50% 51.81%, rgba(91, 35, 225, 0.80) 0%, rgba(113, 41, 230, 0.64) 67.96%, rgba(162, 47, 235, 0.50) 100%), url(${djPortrait})`,
            backgroundColor: 'lightgray',
            backgroundSize: 'cover',
            backgroundPosition: 'bottom'
          }}
        >
          <Switch>
            <Route exact path={[SIGN_UP_PAGE, SIGN_UP_EMAIL_PAGE]}>
              <AudiusValues
                css={{
                  margin: 'auto',
                  opacity: isLoaded ? 1 : 0,
                  transition: `opacity ${motion.expressive} 1s`
                }}
              />
            </Route>
            <Route path={SIGN_IN_PAGE}>
              <Text
                variant='title'
                strength='weak'
                color='staticWhite'
                css={{
                  marginTop: 'auto',
                  opacity: isLoaded ? 1 : 0,
                  transition: `opacity ${motion.expressive} 1s`
                }}
              >
                {messages.newToAudius}{' '}
                <TextLink variant='inverted' showUnderline asChild>
                  <Link to={SIGN_UP_PAGE}>{messages.createAccount}</Link>
                </TextLink>
              </Text>
            </Route>
          </Switch>
        </Flex>
      </Flex>
    )
  }

  return (
    <Flex w='100%' p='unit20'>
      <Link
        to={TRENDING_PAGE}
        css={{
          zIndex: 1,
          position: 'absolute',
          left: spacing['2xl'],
          top: spacing['2xl']
        }}
      >
        <IconCloseAlt color='staticWhite' />
      </Link>
      {/* <BackgroundWaves zIndex={0} /> */}
      <Paper w='100%'>
        <Flex
          direction='column'
          w={isExpanded ? '100%' : 480}
          h='100%'
          css={{
            position: 'absolute',
            top: 0,
            left: 0,
            background: 'white',
            zIndex: 1,
            transition: `width ${motion.expressive}`
          }}
        >
          {routes}
        </Flex>
        <Flex
          alignItems='center'
          justifyContent='center'
          css={{
            marginLeft: 480,
            flexGrow: 1,
            backgroundImage: `radial-gradient(77.16% 77.16% at 50% 51.81%, rgba(91, 35, 225, 0.80) 0%, rgba(113, 41, 230, 0.64) 67.96%, rgba(162, 47, 235, 0.50) 100%), url(${djBackground})`,
            backgroundColor: 'lightgray',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <Switch>
            <Route exact path={SIGN_UP_APP_CTA_PAGE}>
              <Box as='img' w='100%' src={imagePhone} />
            </Route>
            <Route path={SIGN_UP_PAGE}>
              <AudiusValues />
            </Route>
          </Switch>
        </Flex>
      </Paper>
    </Flex>
  )
}
