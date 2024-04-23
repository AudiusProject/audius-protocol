import {
  ThemeProvider as HarmonyThemeProvider,
  IconAudiusLogoHorizontal,
  IconAudiusLogoHorizontalColor,
  Paper,
  Text,
  TextLink
} from '@audius/harmony'
import { Flex } from '@audius/harmony'
import { DistributorList } from './components/DistributorsList'

const messages = {
  connect: 'Connect Distributor',
  access: 'Grant your provider access to publish songs to Audius on your behalf.',
  choose: 'Choose your distributor to login with Audius.',
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

const env = import.meta.env.VITE_ENVIRONMENT as 'dev' | 'stage' | 'prod'

const Footer = () => {
  return (
    <footer>
      <Flex
        justifyContent='space-between'
        alignItems='center'
        backgroundColor='surface1'
        ph='2xl'
        pv='m'
        wrap='wrap'
        columnGap='2xl'
      >
        <Flex alignItems='center' columnGap='2xl' wrap='wrap'>
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
            h='620px'
            w='640px'
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
              textAlign='center'
            >
              {messages.choose}
            </Text>
            <DistributorList environment={env} />
          </Paper>
        </Flex>
        <Footer />
      </Flex>
    </HarmonyThemeProvider>
  )
}
