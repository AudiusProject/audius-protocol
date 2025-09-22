import {
  Button,
  Flex,
  IconArrowRight,
  LoadingSpinner,
  Paper,
  Text
} from '@audius/harmony'

const messages = {
  title: 'Ready to launch?',
  description: 'Connect your wallet to start creating your artist coin.',
  description2:
    'It only takes a few steps to set things up and share it with your fans.',
  buttonText: 'Get Started!'
}

type LaunchPanelProps = {
  onContinue: () => void
  isPending: boolean
}

export const LaunchPanel = ({ onContinue, isPending }: LaunchPanelProps) => {
  return (
    <Paper p='2xl' gap='xl' direction='column' w='100%' h='fit'>
      <Flex direction='column' gap='s'>
        <Text variant='heading' size='m' color='default'>
          {messages.title}
        </Text>
        <Text variant='body' color='subdued'>
          {messages.description}
        </Text>
        <Text variant='body' color='subdued'>
          {messages.description2}
        </Text>
      </Flex>

      <Button
        variant='primary'
        fullWidth
        iconRight={isPending ? undefined : IconArrowRight}
        onClick={onContinue}
        disabled={isPending}
        color='coinGradient'
      >
        {isPending ? <LoadingSpinner /> : messages.buttonText}
      </Button>
    </Paper>
  )
}
