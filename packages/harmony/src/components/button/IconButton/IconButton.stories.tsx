import type { Meta, StoryObj } from '@storybook/react'

import { Flex } from '~harmony/components/layout'
import { IconNote, IconVisibilityHidden } from '~harmony/icons'

import { IconButton, IconButtonProps } from './IconButton'

const meta: Meta<typeof IconButton> = {
  title: 'Buttons/IconButton [beta]',
  component: IconButton,
  args: {
    icon: IconNote,
    'aria-label': 'Play music'
  },
  argTypes: {
    icon: {
      control: false
    }
  }
}

export default meta

type Story = StoryObj<typeof IconButton>

export const Primary: Story = {
  render: (props: IconButtonProps) => <IconButton {...props} />
}

export const Default: Story = {
  render: (props) => <IconButton {...props} />
}

export const Size: Story = {
  render: (props) => (
    <Flex gap='3xl'>
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
    <Flex gap='3xl'>
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
    'aria-label': 'Show password'
  }
}
