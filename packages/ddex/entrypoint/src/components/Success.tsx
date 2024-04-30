import {
  Button,
  IconPlus,
  Text,
  TextLink,
} from '@audius/harmony'
import { useAuth } from '../contexts/AuthProvider'


const messages = {
  allSet: `You're All Set!`,
  access: `You've granted access for your music to be uploaded to Audius through DDEX.`,
  addAnother: 'Add Another Distributor',
  unlink: 'To unlink your account, go to',
  apps: 'Authenticated Apps',
  located: 'located under',
  settings: 'Settings',
  inApp: 'in the Audius app'
}

const env = import.meta.env.VITE_ENVIRONMENT as 'dev' | 'stage' | 'prod'
const settingsLink = env === 'prod'
  ? 'https://audius.co/settings'
  : 'https://staging.audius.co/settings'

export const Success = () => {
  const { logout } = useAuth()

  return (
    <>
      <Text
        variant='heading'
        size='l'
        color='accent'
        textAlign='center'
      >
        {messages.allSet}
      </Text>
      <Text
        variant='body'
        size='m'
        textAlign='center'
        color='default'
      >
        {messages.access}
      </Text>
      <Button
        iconLeft={IconPlus}
        variant="primary"
        size='small'
        onClick={logout}
      >
        {messages.addAnother}
      </Button>
      <Text variant='body' size='m' color='subdued' textAlign='center'>
        {messages.unlink}
        {' '}
        <TextLink variant='visible' href={settingsLink}>
          {messages.apps}
        </TextLink>
        {' '}
        {messages.located}
        {' '}
        <TextLink variant='visible' href={settingsLink}>
          {messages.settings}
        </TextLink>
        {' '}
        {messages.inApp}
      </Text>
    </>
  )
}