import { IconRobot, Button, ButtonProps } from '@audius/harmony'

const messages = {
  aiAttribution: 'AI Attribution',
  hideRemixes: 'Hide Remixes on Track Page'
}

type AiAttributionButtonProps = ButtonProps

export const AiAttributionButton = (props: AiAttributionButtonProps) => {
  return (
    <Button
      {...props}
      name='aiAttribution'
      size='small'
      variant='secondary'
      iconLeft={IconRobot}
    >
      {messages.aiAttribution}
    </Button>
  )
}
