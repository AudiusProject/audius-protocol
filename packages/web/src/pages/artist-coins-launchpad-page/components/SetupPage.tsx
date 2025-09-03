import { Flex, Paper, Text } from '@audius/harmony'

const messages = {
  title: 'Set Up Your Artist Coin',
  description: 'Configure the details for your artist coin.',
  comingSoon: 'Setup functionality coming soon...'
}

type SetupPageProps = {
  onContinue?: () => void
}

export const SetupPage = ({ onContinue }: SetupPageProps) => {
  return (
    <Flex direction='column' alignItems='center' justifyContent='center' p='2xl' gap='l'>
      <Paper p='2xl' gap='xl' direction='column' w='100%' maxWidth='600px'>
        <Flex direction='column' gap='s' alignItems='center'>
          <Text variant='heading' size='l' color='default'>
            {messages.title}
          </Text>
          <Text variant='body' color='subdued' textAlign='center'>
            {messages.description}
          </Text>
          <Text variant='body' color='subdued' textAlign='center'>
            {messages.comingSoon}
          </Text>
        </Flex>
      </Paper>
    </Flex>
  )
}
