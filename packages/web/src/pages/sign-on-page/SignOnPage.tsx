import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react'

import {
  Box,
  Flex,
  IconCloseAlt,
  Paper,
  Text,
  TextLink,
  useTheme
} from '@audius/harmony'
import { useSelector } from 'react-redux'
import { useSelector } from 'react-redux'
import { Link, Route, Switch, useRouteMatch } from 'react-router-dom'
import { useEffectOnce, useMeasure } from 'react-use'

import djBackground from 'assets/img/2-DJ-4-3.jpg'
import djPortrait from 'assets/img/DJportrait.jpg'
import imagePhone from 'assets/img/imagePhone.png'
import {
  getHasCompletedAccount,
  getStatus
} from 'common/store/pages/signon/selectors'
import { EditingStatus } from 'common/store/pages/signon/types'
import BackgroundWaves from 'components/background-animations/BackgroundWaves'
import { useMedia } from 'hooks/useMedia'
import { SignInPage } from 'pages/sign-in-page/SignInPage'
import { AudiusValues } from 'pages/sign-on-page/AudiusValues'
import SignUpPage from 'pages/sign-up-page'
import { NavHeader } from 'pages/sign-up-page/components/NavHeader'
import { ScrollView } from 'pages/sign-up-page/components/layout'
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

type RootProps = {
  children: ReactNode
}

const DesktopSignOnRoot = (props: RootProps) => {
  const { children } = props
  const { spacing, motion } = useTheme()
  const hasCompletedAccount = useSelector(getHasCompletedAccount)

  console.log({ hasCompletedAccount })
  const accountCreationStatus = useSelector(getStatus)

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

  const isExpanded = !collapsedDesktopPageMatch

  return (
    <Flex w='100%' p='unit14' justifyContent='center'>
      {accountCreationStatus !== EditingStatus.LOADING ? (
        <Link
          to={TRENDING_PAGE}
          css={{
            zIndex: 1,
            position: 'absolute',
            left: spacing.xl,
            top: spacing.xl
          }}
        >
          <IconCloseAlt color='staticWhite' />
        </Link>
      ) : null}
      <BackgroundWaves zIndex={0} />
      <Paper
        w='100%'
        css={{
          flex: 1,
          maxWidth: 1440,
          minWidth: 744,
          overflow: 'hidden'
        }}
      >
        <ScrollView
          direction='column'
          h='100%'
          w={isExpanded ? '100%' : 584}
          flex={isExpanded ? undefined : '1 0 0'}
          css={{
            maxWidth: isExpanded ? '100%' : 584,
            minWidth: 400,
            background: 'white',
            zIndex: 1,
            transition: `width ${motion.expressive}`
          }}
        >
          {children}
        </ScrollView>
        <Flex
          alignItems='center'
          justifyContent='center'
          flex='1 0 0'
          css={{
            zIndex: 0,
            overflow: 'hidden',
            backgroundImage: `radial-gradient(77.16% 77.16% at 50% 51.81%, rgba(91, 35, 225, 0.80) 0%, rgba(113, 41, 230, 0.64) 67.96%, rgba(162, 47, 235, 0.50) 100%), url(${djBackground})`,
            backgroundColor: 'lightgray',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <Switch>
            <Route exact path={SIGN_UP_APP_CTA_PAGE}>
              {/* @ts-ignore box type incorrect */}
              <Box as='img' w='100%' src={imagePhone} />
            </Route>
            <Route path={[SIGN_IN_PAGE, SIGN_UP_PAGE]}>
              {isExpanded ? null : <AudiusValues />}
            </Route>
          </Switch>
        </Flex>
      </Paper>
    </Flex>
  )
}

type MobileSignOnRootProps = RootProps & {
  isLoaded?: boolean
}

type PanelState = 'collapsed' | 'expanding' | 'expanded' | 'collapsing'

const MobileSignOnRoot = (props: MobileSignOnRootProps) => {
  const { children, isLoaded } = props
  const [panelState, setPanelState] = useState<PanelState>('collapsed')
  const { motion } = useTheme()
  const [ref, { height: panelHeight }] = useMeasure<HTMLDivElement>()
  const collapsedPanelHeight = useRef(panelHeight)

  const collapsedMobilePageMatch = useRouteMatch({
    path: [SIGN_IN_PAGE, SIGN_UP_PAGE, SIGN_UP_EMAIL_PAGE],
    exact: true
  })

  const shouldPageExpand = !collapsedMobilePageMatch

  useLayoutEffect(() => {
    if (panelState === 'collapsed') {
      collapsedPanelHeight.current = panelHeight
    }
  }, [panelState, panelHeight])

  // TODO: use `onTransitionEnd`
  useEffect(() => {
    if (shouldPageExpand) {
      setPanelState('expanding')
      const timeout = setTimeout(() => {
        setPanelState('expanded')
      }, 100)
      return () => clearTimeout(timeout)
    } else if (!shouldPageExpand && panelState === 'expanded') {
      setPanelState('collapsing')
      const timeout = setTimeout(() => {
        setPanelState('collapsed')
      }, 500)
      return () => clearTimeout(timeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldPageExpand])

  const panelHeightMap = {
    collapsed: 'auto',
    expanding: panelHeight,
    expanded: '100%',
    collapsing: collapsedPanelHeight.current
  }

  return (
    <Flex direction='column' w='100%'>
      <Flex
        ref={ref}
        direction='column'
        borderBottomLeftRadius={panelState === 'expanded' ? undefined : '2xl'}
        borderBottomRightRadius={panelState === 'expanded' ? undefined : '2xl'}
        h={panelHeightMap[panelState]}
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
        {children}
      </Flex>
      <Flex
        direction='column'
        alignItems='center'
        pb='2xl'
        css={{
          paddingTop: collapsedPanelHeight.current,
          flexGrow: 1,
          backgroundImage: `radial-gradient(77.16% 77.16% at 50% 51.81%, rgba(91, 35, 225, 0.80) 0%, rgba(113, 41, 230, 0.64) 67.96%, rgba(162, 47, 235, 0.50) 100%), url(${djPortrait})`,
          backgroundColor: 'lightgray',
          backgroundSize: 'cover',
          backgroundPosition: 'bottom'
        }}
      >
        <Switch>
          <Route path={SIGN_UP_PAGE}>
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

export const SignOnPage = () => {
  const { isMobile } = useMedia()

  const [isLoaded, setIsLoaded] = useState(false)
  const SignOnRoot = isMobile ? MobileSignOnRoot : DesktopSignOnRoot

  useEffectOnce(() => {
    setIsLoaded(true)
  })

  return (
    <SignOnRoot isLoaded={isLoaded}>
      <NavHeader />
      <Switch>
        <Route path={SIGN_IN_PAGE}>
          <SignInPage />
        </Route>
        <Route path={SIGN_UP_PAGE}>
          <SignUpPage />
        </Route>
      </Switch>
    </SignOnRoot>
  )
}
