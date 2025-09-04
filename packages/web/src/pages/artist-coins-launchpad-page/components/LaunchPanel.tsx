import {
  Button,
  Flex,
  IconArrowRight,
  Paper,
  Text,
  useTheme
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
}

export const LaunchPanel = ({ onContinue }: LaunchPanelProps) => {
  const { color } = useTheme()

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
        iconRight={IconArrowRight}
        onClick={onContinue}
        css={{
          background: `linear-gradient(91deg, ${color.primary.p300} -7.07%, ${color.secondary.s300} 50.55%, ${color.special.blue} 108.17%)`,
          border: 'none'
        }}
      >
        {messages.buttonText}
      </Button>
    </Paper>
  )
}
