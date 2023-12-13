import type { Meta, StoryObj } from '@storybook/react-native'

import { IconQuestionCircle } from '@audius/harmony-native'

import { Flex } from '../layout/Flex/Flex'

import type { HintProps } from './Hint'
import { Hint } from './Hint'

const messages = {
  hintMessage: 'A helpful hint message to provide information to the user'
}

const meta: Meta<HintProps> = {
  title: 'Components/Hint',
  component: Hint,
  argTypes: {},
  args: {
    icon: IconQuestionCircle
  },
  render: (props) => (
    <Flex p='l'>
      <Hint {...props}>{messages.hintMessage}</Hint>
    </Flex>
  )
}

export default meta

type Story = StoryObj<HintProps>

export const Default: Story = {}
