import type { Meta, StoryObj } from '@storybook/react'

import { Flex } from 'components/layout'
import { IconNote, IconVisibilityHidden } from 'icons'

import { IconButton, IconButtonProps } from './IconButton'

const meta: Meta<typeof IconButton> = {
  title: 'Buttons/IconButton [beta]',
  component: IconButton,
  args: {
    Icon: IconNote,
    'aria-label': 'Play music'
  },
  argTypes: {
    Icon: {
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
  render: () => <IconButton Icon={IconNote} aria-label='Play music' />
}

export const Size: Story = {
  render: () => (
    <Flex gap='3xl'>
      <IconButton Icon={IconNote} aria-label='Play music' size='xs' />
      <IconButton Icon={IconNote} aria-label='Play music' size='s' />
      <IconButton Icon={IconNote} aria-label='Play music' size='m' />
      <IconButton Icon={IconNote} aria-label='Play music' size='l' />
      <IconButton Icon={IconNote} aria-label='Play music' size='2xl' />
    </Flex>
  )
}

export const Color: Story = {
  render: () => (
    <Flex gap='3xl'>
      <IconButton Icon={IconNote} aria-label='Play music' color='default' />
      <IconButton Icon={IconNote} aria-label='Play music' color='subdued' />
      <IconButton Icon={IconNote} aria-label='Play music' disabled />
    </Flex>
  )
}

export const Ripple: Story = {
  render: () => (
    <IconButton ripple Icon={IconVisibilityHidden} aria-label='Play music' />
  )
}
