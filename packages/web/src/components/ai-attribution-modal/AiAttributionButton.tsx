import { IconRobot } from '@audius/harmony'
import { Button, ButtonProps, ButtonSize, ButtonType } from '@audius/stems'

const messages = {
  aiAttribution: 'AI Attribution',
  hideRemixes: 'Hide Remixes on Track Page'
}

type AiAttributionButtonProps = ButtonProps

export const AiAttributionButton = (props: AiAttributionButtonProps) => {
  return (
    <Button
      {...props}
      type={ButtonType.COMMON_ALT}
      name='aiAttribution'
      size={ButtonSize.SMALL}
      text={messages.aiAttribution}
      leftIcon={<IconRobot />}
    />
  )
}
