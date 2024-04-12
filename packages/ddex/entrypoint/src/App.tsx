import { useCallback } from 'react'
import {
  ThemeProvider as HarmonyThemeProvider,
  IconArrowRight,
  IconAudiusLogoHorizontal,
  IconAudiusLogoHorizontalColor,
  Paper,
  Text,
  TextLink
} from '@audius/harmony'
import { Button, Flex } from '@audius/harmony'

const messages = {
  connect: 'Connect Distributor',
  access: 'Grant your provider access to publish songs to Audius on your behalf.',
  choose: 'Please choose your distributor',
  login: 'Log in with Audius',
  questions: 'Got questions',
  learnMore: 'Learn more',
  privacy: 'Privacy',
  terms: 'Terms',
  developers: 'Developers',
  audius: 'Audius'
}

const links = {
  privacy: 'https://audius.co/legal/privacy-policy',
  terms: 'https://audius.co/legal/terms-of-use',
  developers: 'https://docs.audius.org',
  audius: 'https://audius.co'
}

const Footer = () => {
  return (
    <footer>
      <Flex
        justifyContent='space-between'
        alignItems='center'
        backgroundColor='surface1'
        ph='2xl'
        h={'unit8'}
      >
        <Flex alignItems='center' gap='2xl'>
          <Flex alignItems='center' gap='s'>
            <IconAudiusLogoHorizontal width={'80px'} height={'20px'} color='subdued' />
            <Text
              variant='body'
              size='s'
              color='subdued'
            >
              &copy; {new Date().getFullYear()}
            </Text>
          </Flex>
          <TextLink
            variant='subdued'
            textVariant='body'
            size='s'
            color='subdued'
            href={links.privacy}
          >{messages.privacy}</TextLink>
          <TextLink
            variant='subdued'
            textVariant='body'
            size='s'
            color='subdued'
            href={links.terms}
          >{messages.terms}</TextLink>
        </Flex>
        <Flex alignItems='center' gap='2xl'>
          <TextLink
            variant='subdued'
            textVariant='body'
            size='s'
            color='subdued'
            href={links.developers}
          >{messages.developers}</TextLink>
          <TextLink
            variant='subdued'
            textVariant='body'
            size='s'
            color='subdued'
            href={links.audius}
          >{messages.audius}</TextLink>
        </Flex>
      </Flex>
    </footer>
  )
}


export default function App() {
  const onClickLogin = useCallback(() => {
    window.open('http://localhost:5174/login?auto=true', '_self')
  }, [])

  return (
    <HarmonyThemeProvider theme='day'>
      <Flex
        direction='column'
        backgroundColor='default'
        h={'100vh'}
      >
        <Flex
          flex={1}
          gap='m'
          justifyContent='center'
          alignItems='center'
        >
          <Paper
            h='460px'
            w='416px'
            direction='column'
            p='2xl'
            gap='2xl'
          >
            <Flex justifyContent='center'>
              <IconAudiusLogoHorizontalColor />
            </Flex>
            <Text
              variant='heading'
              size='l'
              color='accent'
              textAlign='center'
            >
              {messages.connect}
            </Text>
            <Text
              variant='body'
              size='m'
              textAlign='center'
              color='default'
            >
              {messages.access}
            </Text>
            <Text
              variant='body'
              size='m'
              color='default'
            >
              {`${messages.choose}:`}
            </Text>
            <Button
              variant='primary'
              onClick={onClickLogin}
              iconRight={IconArrowRight}
            >
              {messages.login}
            </Button>
          </Paper>
        </Flex>
        <Footer />
      </Flex>
    </HarmonyThemeProvider>
  )
}
