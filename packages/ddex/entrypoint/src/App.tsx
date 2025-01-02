import {
  ThemeProvider as HarmonyThemeProvider,
  IconAudiusLogoHorizontalColor,
  Paper,
  TextLink,
  Text,
  Button
} from '@audius/harmony'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Flex } from '@audius/harmony'
import { Footer } from './components/Footer'
import { ConnectDistributor } from './components/ConnectDistributor'
import { AuthProvider, useAuth } from './contexts/AuthProvider'
import { Success } from './components/Success'
import { Status } from './contexts/types'
import { PreloadImage } from './components/PreloadImage'

const queryClient = new QueryClient()

const supportLink = 'mailto:ddex-support@audius.co'

const messages = {
  loggedIn: 'Logged in as',
  signOut: 'Sign Out',
  support: `If you're supposed to be an admin with access to manage deliveries, please contact us at`
}

const Support = () => {
  const { user } = useAuth()
  if (!user) {
    return null
  }

  return (
    <Text variant='body' size='m' textAlign='center' color='default'>
      {messages.support}{' '}
      <TextLink variant='visible' href={supportLink}>
        ddex-support@audius.co
      </TextLink>
      {'.'}
    </Text>
  )
}

const Nav = () => {
  const { user, logout } = useAuth()
  if (!user) {
    return null
  }

  return (
    <Flex
      ph='2xl'
      pv='l'
      justifyContent='space-between'
      alignItems='cener'
      backgroundColor='surface1'
    >
      <Flex alignItems='center' gap='s'>
        <Flex
          h='32px'
          w='32px'
          border='strong'
          css={{
            overflow: 'hidden',
            borderRadius: '50%'
          }}
        >
          {user.profilePicture?._150x150 ? (
            <PreloadImage src={user.profilePicture?._150x150} />
          ) : null}
        </Flex>
        <Text variant='body' size='l' color='default'>
          {`${messages.loggedIn} @${user.handle}`}
        </Text>
      </Flex>
      <Button variant='secondary' size='small' onClick={logout}>
        {messages.signOut}
      </Button>
    </Flex>
  )
}

const Page = () => {
  const { user, status } = useAuth()
  return (
    <Flex
      direction='column'
      backgroundColor='default'
      css={{ userSelect: 'none', minHeight: '100vh' }}
    >
      {status === Status.LOADING || status === Status.IDLE ? (
        <></>
      ) : (
        <>
          <Nav />
          <Flex flex={1} direction='column' alignItems='center' p='unit14'>
            <Flex
              w='640px'
              gap='xl'
              direction='column'
              justifyContent='center'
              alignItems='center'
            >
              <Paper direction='column' p='2xl' gap='2xl' w='640px'>
                <Flex justifyContent='center'>
                  <IconAudiusLogoHorizontalColor />
                </Flex>
                {user ? <Success /> : <ConnectDistributor />}
              </Paper>
              <Support />
            </Flex>
          </Flex>
          <Footer />
        </>
      )}
    </Flex>
  )
}

export const App = () => {
  return (
    <HarmonyThemeProvider theme='day' version='v2'>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Page />
        </AuthProvider>
      </QueryClientProvider>
    </HarmonyThemeProvider>
  )
}
