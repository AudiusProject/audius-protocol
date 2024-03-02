import type { Meta, StoryObj } from '@storybook/react-native'

import { IconRepost } from '@audius/harmony-native'

import { Flex } from '../../layout'

import { EntityActionButton } from './EntityActionButton'
import type { EntityActionButtonProps } from './types'

const meta: Meta<ButtonProps> = {
  title: 'Components/Button/EntityActionButton',
  component: EntityActionButton,
  argTypes: {
    isActive: {
      description: 'Active',
      control: {
        type: 'boolean'
      }
    }
  },
  args: {
    iconLeft: IconRepost
  },
  render: (props) => (
    <Flex p='l'>
      <Button {...props}>Repost Me</Button>
    </Flex>
  )
}

export default meta

type Story = StoryObj<ButtonProps>

export const Default: Story = {}
