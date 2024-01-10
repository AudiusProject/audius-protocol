import type { Meta, StoryObj } from '@storybook/react-native'

import { IconHeart, IconVisibilityHidden } from '@audius/harmony-native'

import { Flex } from '../../layout/Flex/Flex'

import type { IconButtonProps } from './IconButton'
import { IconButton } from './IconButton'

const meta: Meta<IconButtonProps> = {
  title: 'Components/Button/IconButton',
  component: IconButton,
  argTypes: {
    size: {
      description: 'Size',
      control: { type: 'radio' },
      options: ['small', 'large']
    },
    disabled: {
      description: 'Disabled',
      control: {
        type: 'boolean'
      }
    },
    accessibilityLabel: {
      description: 'Accessibility label',
      control: {
        type: 'text'
      }
    }
  },
  args: {
    icon: IconHeart,
    accessibilityLabel: 'Play music'
  },
  render: (props) => (
    <Flex p='l' direction='row' justifyContent='center'>
      <IconButton {...props} />
    </Flex>
  )
}

export default meta

type Story = StoryObj<IconButtonProps>

export const Default: Story = {}

export const Size: Story = {
  render: (props) => (
    <Flex gap='3xl' direction='row'>
      <IconButton {...props} size='xs' />
      <IconButton {...props} size='s' />
      <IconButton {...props} size='m' />
      <IconButton {...props} size='l' />
      <IconButton {...props} size='2xl' />
    </Flex>
  )
}

export const Color: Story = {
  render: (props) => (
    <Flex gap='3xl' direction='row'>
      <IconButton {...props} color='default' />
      <IconButton {...props} color='subdued' />
      <IconButton {...props} disabled />
    </Flex>
  )
}

export const Ripple: Story = {
  args: {
    ripple: true,
    icon: IconVisibilityHidden,
    accessibilityLabel: 'Show password'
  }
}
