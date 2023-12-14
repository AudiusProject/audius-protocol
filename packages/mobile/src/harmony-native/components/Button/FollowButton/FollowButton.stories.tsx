import type { Meta, StoryObj } from '@storybook/react-native'

import { Flex } from '../../layout'

import { FollowButton } from './FollowButton'
import type { FollowButtonProps } from './types'

const meta: Meta<FollowButtonProps> = {
  title: 'Components/Button/FollowButton',
  component: FollowButton,
  argTypes: {
    variant: {
      description: 'Variant',
      control: { type: 'radio' },
      options: ['default', 'pill']
    },
    size: {
      description: 'Size',
      control: { type: 'radio' },
      options: ['small', 'large']
    },
    isFollowing: {
      description: 'Following',
      control: {
        type: 'boolean'
      }
    },
    disabled: {
      description: 'Disabled',
      control: {
        type: 'boolean'
      }
    }
  },
  render: (props) => (
    <Flex p='l'>
      <FollowButton {...props} />
    </Flex>
  )
}

export default meta

type Story = StoryObj<FollowButtonProps>

export const Default: Story = {}

export const Small: Story = {
  args: {
    size: 'small'
  }
}

export const Pill: Story = {
  args: {
    variant: 'pill'
  }
}
