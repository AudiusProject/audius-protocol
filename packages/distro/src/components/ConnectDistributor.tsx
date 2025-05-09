import {
  Text,
} from '@audius/harmony'
import { DistributorList } from './DistributorsList'

const messages = {
  connect: 'Connect Distributor',
  access: 'Grant your provider access to publish songs to Audius on your behalf.',
  choose: 'Choose your distributor to login with Audius.',
  questions: 'Got questions',
  learnMore: 'Learn more'
}

export const ConnectDistributor = () => {
  return (
    <>
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
      <DistributorList />
    </>
  )
}