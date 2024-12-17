import type { Meta, StoryObj } from '@storybook/react-native'

import img from '../../storybook/assets/shadowBackground.jpg'
import { Flex } from '../layout/Flex/Flex'

import type { AvatarProps } from './Avatar'
import { Avatar } from './Avatar'

const meta: Meta<AvatarProps> = {
  title: 'Components/Avatar',
  component: Avatar,
  argTypes: {
    source: {
      description: 'Image Source',
      control: { type: 'text' }
    },
    variant: {
      description: 'Variant',
      control: { type: 'radio' },
      options: ['default', 'strong']
    },
    size: {
      description: 'Size',
      control: { type: 'radio' },
      options: ['auto', 'small', 'large']
    },
    borderWidth: {
      description: 'Stroke Width',
      control: { type: 'radio' },
      options: ['thin', 'default']
    }
  },
  args: {
    source: img,
    size: 'large'
  },
  render: (props) => (
    <Flex p='l'>
      <Avatar {...props} />
    </Flex>
  )
}

export default meta

type Story = StoryObj<AvatarProps>

export const Default: Story = {}

export const Small: Story = {
  args: {
    size: 'small'
  }
}
