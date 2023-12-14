import type { CompletionCheckProps } from '@audius/harmony'
import type { Meta, StoryObj } from '@storybook/react-native'

import { Flex } from '../layout/Flex/Flex'

import { CompletionCheck } from './CompletionCheck'

const meta: Meta<CompletionCheckProps> = {
  title: 'Components/Input/CompletionCheck',
  component: CompletionCheck,
  argTypes: {
    value: {
      description: 'Value',
      control: { type: 'radio' },
      options: ['incomplete', 'complete', 'error']
    }
  },
  render: (props) => (
    <Flex p='l'>
      <CompletionCheck {...props} />
    </Flex>
  )
}

export default meta

type Story = StoryObj<CompletionCheckProps>

export const Default: Story = {}
